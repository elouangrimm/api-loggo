import { Hono } from 'hono';

const app = new Hono()
    .get('/list', (c) => c.text('Not implemented', 501))
    .post('/update', (c) => c.text('Not implemented', 501))
    .post('/login', (c) => c.text('Not implemented', 501))
    .post('/delete', (c) => c.text('Not implemented', 501))
    .post('/ban', (c) => c.text('Not implemented', 501));

export default app;
