/// <reference types="vitest" />
// @ts-nocheck

import request from 'supertest';
import { describe, it, expect } from 'vitest';
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

    it2('update handle persists on profile', async () => {
        const agent3 = request.agent(app as any);
        const localEmail = 'handletest@example.com';
        const localPass = 'pass1234';

        await agent3.post('/signup').send({ email: localEmail, password: localPass }).expect(201);
        const loginRes = await agent3.post('/login').send({ email: localEmail, password: localPass }).expect(200);
        const access = loginRes.body.accessToken;

        const res = await agent3.put('/profile').set('Authorization', `Bearer ${access}`).send({ handle: 'newhandle' }).expect(200);
        expect2(res.body.user.handle).toBe('newhandle');

        // Use debug endpoint to confirm the raw DB row contains the handle.
        const raw = await agent3.get('/debug/raw-profile').set('Authorization', `Bearer ${access}`).expect(200);
        expect2(raw.body.row.handle).toBe('newhandle');
    });

    it2('cannot update handle to an already used value', async () => {
        const agentA = request.agent(app as any);
        const agentB = request.agent(app as any);

        await agentA.post('/signup').send({ email: 'a@example.com', password: 'passA' }).expect(201);
        const loginA = await agentA.post('/login').send({ email: 'a@example.com', password: 'passA' }).expect(200);
        const tokenA = loginA.body.accessToken;

        await agentA.put('/profile').set('Authorization', `Bearer ${tokenA}`).send({ handle: 'takenhandle' }).expect(200);

        await agentB.post('/signup').send({ email: 'b@example.com', password: 'passB' }).expect(201);
        const loginB = await agentB.post('/login').send({ email: 'b@example.com', password: 'passB' }).expect(200);
        const tokenB = loginB.body.accessToken;

        // Attempt to change B's handle to the same as A's
        const res = await agentB.put('/profile').set('Authorization', `Bearer ${tokenB}`).send({ handle: 'takenhandle' }).expect(400);
        expect2(res.body.message).toBe('Handle already taken');
    });

    it2('anonymous cannot create post', async () => {
        const agent2 = request.agent(app as any);
        const res = await agent2.put('/post').send({ title: 'anon', body: 'nope' });
        expect2(res.status).toBe(401);
    });
});
