import { Hono } from 'hono';
import bcrypt from 'bcryptjs';

type Bindings = {
    db: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>()
    .get('/logs', async (c) => {
        const { results: users } = await c.env.db
            .prepare('SELECT * FROM `logiverse_users` ORDER BY `last_updated` DESC')
            .run();
        return c.json(users.map((user) => Object.values(user)));
    })
    .post('/update', (c) => c.text('Not implemented', 501))
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

            if (username.toLowerCase().includes('svenlaa')) return c.json({ error: 'no svenlaa impersonation' }, 400);

            const hashedPassword = await bcrypt.hash(password, 10);

            const { results: newUsers } = await c.env.db
                .prepare('INSERT INTO `logiverse_users` (username, password) VALUES (?, ?) RETURNING *')
                .bind(username, hashedPassword)
                .all();

            return c.json(Object.values(newUsers[0]));
        }

        const existingUser = existingUsers[0];
        if (existingUser.banned) return c.json({ error: 'user is banned' }, 400);

        const passwordsMatch = bcrypt.compare(password, existingUser.password as string);
        if (!passwordsMatch) return c.json({ error: 'wrong password' }, 400);

        return c.json(Object.values(existingUser));
    })
    .post('/delete', (c) => c.text('Not implemented', 501))
    .post('/ban', (c) => c.text('Not implemented', 501));

export default app;
