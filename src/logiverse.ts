import { Hono } from 'hono';
import bcrypt from 'bcryptjs';

type Bindings = {
    db: D1Database;
};

const ADMIN_NAME = 'Svenlaa';

const app = new Hono<{ Bindings: Bindings }>()
    .get('/logs', async (c) => {
        const { results: users } = await c.env.db
            .prepare('SELECT status, username, last_updated, gif, banned FROM `logiverse_users` WHERE banned = 0')
            .run();
        return c.json(users.map((user) => Object.values(user)));
    })
    .post('/update', async (c) => {
        const body = await c.req.json();
        const { username, password, status, gif = null } = body;
        const { results: users } = await c.env.db
            .prepare('SELECT * FROM `logiverse_users` WHERE username = ?')
            .bind(username)
            .run();

        if (users.length === 0) return c.json({ error: 'user not found' }, 400);

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password as string);

        if (!passwordMatch) return c.json({ error: 'wrong password' }, 401);

        if (user.banned === 1) return c.json({ error: 'user is banned' }, 403);

        if (status.length > 9999) return c.json({ error: 'status too long' }, 400);

        await c.env.db
            .prepare(
                'UPDATE `logiverse_users` SET status = ?, gif = ?, last_updated = CURRENT_TIMESTAMP WHERE username = ? RETURNING gif, password, status, username'
            )
            .bind(status, gif, username)
            .run();

        return c.json({ gif, password, status, username }, 200);
    })
    .post('/login', async (c) => {
        const body = await c.req.json();
        let { username, password } = body;

        if (!username || !password) return c.json({ error: 'Missing username or password' }, 400);

        if (password.length > 50) return c.json({ error: 'Password too long, max 50 chars' }, 400);

        if (username.length > 50) return c.json({ error: 'Username too long, max 50 chars' }, 400);

        const { results: existingUsers } = await c.env.db
            .prepare('SELECT * FROM `logiverse_users` WHERE `username` = ?')
            .bind(username)
            .run();

        const bannedCharacters = [
            ' ', // tab
            '\t', // newline
            '\n', // carriage return
            '\r', // zero width character
            '\u200b', // zero width joiner
            '\u200d', // zero width non-joiner
            '\u200c', // braille
            '\u2800',
            '​',
            ' ',
        ];

        if (existingUsers.length === 0) {
            if (bannedCharacters.some((char) => username.includes(char)))
                return c.json({ error: 'username contains banned characters. no spaces, etc...' }, 400);

            if (username.toLowerCase().includes(ADMIN_NAME.toLowerCase()))
                return c.json({ error: 'no admin impersonation' }, 400);

            const hashedPassword = await bcrypt.hash(password, 10);

            const { results: newUsers } = await c.env.db
                .prepare('INSERT INTO `logiverse_users` (username, password) VALUES (?, ?) RETURNING *')
                .bind(username, hashedPassword)
                .all();

            return c.json(Object.values(newUsers[0]));
        }

        const existingUser = existingUsers[0];
        if (existingUser.banned) return c.json({ error: 'user is banned' }, 400);

        const passwordsMatch = await bcrypt.compare(password, existingUser.password as string);
        if (!passwordsMatch) return c.json({ error: 'wrong password' }, 400);

        return c.json(Object.values(existingUser));
    })
    .post('/delete', async (c) => {
        const body = await c.req.json();
        const { username, password } = body;
        const { results: users } = await c.env.db
            .prepare('SELECT * FROM `logiverse_users` WHERE username = ?')
            .bind(username)
            .run();

        if (users.length === 0) return c.json({ error: 'user not found' }, 404);

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password as string);

        if (username === ADMIN_NAME) return c.json({ error: 'cannot delete admin' }, 400);

        if (!passwordMatch) return c.json({ error: 'wrong password' }, 401);

        if (user.banned) return c.json({ error: 'user is banned' }, 403);

        await c.env.db.prepare('DELETE FROM `logiverse_users` WHERE username = ?').bind(username).run();

        return c.json(user, 200);
    })
    .post('/ban', (c) => c.text('Not implemented', 501));

export default app;
