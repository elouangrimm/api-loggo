import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.html('Why are you here? Visit <a href="https://svenlaa.com">svenlaa.com</a> for the site!'));

export default app;
