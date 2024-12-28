import { Hono } from 'hono';
import logiverse from './logiverse';
import { cors } from 'hono/cors';

const app = new Hono()
    .use(cors({ origin: '*' }))
    .get('/', (c) =>
        c.html(
            '<meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>logivert api</title>Why are you here? Visit <a href="https://logivert.pages.dev">loggo.pages.dev</a> for the site!'
        )
    );

app.route('/logiverse', logiverse);

export default app;
