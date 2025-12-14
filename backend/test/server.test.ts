/// <reference types="vitest" />
// @ts-nocheck

import request from 'supertest';
import app from '../server';

describe('backend root', () => {
    it('returns status json', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'success' });
    });
});

// Basic auth flow tests
import { describe as d2, it as it2, expect as expect2, beforeAll, afterAll } from 'vitest';

d2('auth flows', () => {
    let agent = request.agent(app as any);
    const email = 'test@example.com';
    const password = 'pass123';

    it2('signup -> login -> access protected -> refresh -> logout', async () => {
        // signup
        await agent.post('/signup').send({ email, password }).expect(201);
        // login
        const loginRes = await agent.post('/login').send({ email, password }).expect(200);
        expect2(loginRes.body.accessToken).toBeDefined();
        const access = loginRes.body.accessToken;
        // access protected
        await agent.get('/profile').set('Authorization', `Bearer ${access}`).expect(200);
        // refresh
        const refreshRes = await agent.post('/refresh').expect(200);
        expect2(refreshRes.body.accessToken).toBeDefined();
        // logout
        await agent.post('/logout').expect(200);
        // refresh after logout -> should fail
        await agent.post('/refresh').expect(401);
    });

    it2('anonymous cannot create post', async () => {
        const agent2 = request.agent(app as any);
        const res = await agent2.put('/post').send({ title: 'anon', body: 'nope' });
        expect2(res.status).toBe(401);
    });
});
