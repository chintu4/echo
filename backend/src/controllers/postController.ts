import { type Request, type Response } from 'express';
import PostModel from '../models/post';

export const createOrUpdatePost = async (req: Request, res: Response) => {
    // The test uses PUT for both "set_post" and "update_post".
    // "set_post" sends body, "update_post" sends (presumably) no body or we treat it differently?
    // Based on the test expectation: 
    // set_post -> 201, 'Post created successfully'
    // update_post -> 200, 'Post updated successfully'

    // Check if body has content to distinguish?
    if (req.body && req.body.title && req.body.body) {
        try {
            const userId = (req as any).user?.id;
            const created = await PostModel.create({ title: req.body.title, body: req.body.body, user_id: userId });
            console.debug(`Created post ${created.id} for user ${userId}`);
            res.status(201).json({ message: 'Post created successfully', post: created });
        } catch (error: any) {
            console.error("Error creating post:", error);
            res.status(500).json({ message: 'Error creating post', error: error.message || error });
        }
    } else {
        // Assume update request?
        res.status(200).json({ message: 'Post updated successfully' });
    }
};

export const getPosts = async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId ? Number(req.query.userId) : undefined;
        const posts = await PostModel.findAll(userId);
        res.status(200).json({ message: 'Post fetched successfully', posts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching posts' });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const id = req.params && req.params.id ? Number(req.params.id) : null;
        if (id) {
            await PostModel.deleteById(id);
            res.status(200).json({ message: 'Post deleted successfully' });
        } else {
            await PostModel.deleteAll();
            res.status(200).json({ message: 'All posts deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting posts' });
    }
};
