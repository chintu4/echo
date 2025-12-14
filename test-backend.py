import requests as rq
import unittest
import json  # You don't actually need to import json anymore since you're comparing dictionaries

class TestAPI(unittest.TestCase): 
    
    def test_get(self):
        # This sends an HTTP GET request to your running server
        response = rq.get("http://localhost:5000/") 
        
        # response.json() converts the server's JSON payload into a Python dictionary.
        # This line asserts that the dictionary from the server matches the expected dictionary.
        self.assertEqual(response.json(), {'status': 'success'}) 
    def test_login(self):
        # This sends an HTTP GET request to your running server
        body={
            "email":"chintu@gmail.com",
            "password":"pass"
        }
        response = rq.post("http://localhost:5000/login",
        json=body
        ) 
        print(response.status_code)
        print(response.json())
        # We expect 401 because the user does not exist in the new DB
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {'message': 'Invalid credentials'})
    def test_signup(self):
        body={
            "email":"chintu@gmail.com",
            "password":"pass"
        }
        response = rq.post("http://localhost:5000/signup",
        json=body
        ) 
        print(response.status_code)
        print(response.json())
        # We expect 401 because the user does not exist in the new DB
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {'message': 'User created successfully'})
    def test_set_post(self):
        body={
            "title":"chintu@gmail.com",
            "body":"pass"
        }
        response = rq.put("http://localhost:5000/post",
        json=body
        ) 
        print(response.status_code)
        print(response.json())
        # We expect 401 because the user does not exist in the new DB
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {'message': 'Post created successfully'})
    def test_get_post(self):
        response = rq.get("http://localhost:5000/post") 
        print(response.status_code)
        print(response.json())
        # We expect 401 because the user does not exist in the new DB
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'message': 'Post fetched successfully', 'posts': []})
    def test_get_post_by_id(self):
        response = rq.get("http://localhost:5000/post") 
        print(response.status_code)
        print(response.json())
        # We expect 401 because the user does not exist in the new DB
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'message': 'Post fetched successfully', 'posts': []})
    def test_delete_post(self):
        response = rq.delete("http://localhost:5000/post") 
        print(response.status_code)
        print(response.json())
        # We expect 401 because the user does not exist in the new DB
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'message': 'Post deleted successfully'})

    def test_delete_post_by_id(self):
        # Create a post
        body={
            "title":"to-delete",
            "body":"please delete"
        }
        r1 = rq.put("http://localhost:5000/post", json=body)
        self.assertEqual(r1.status_code, 201)

        # Get posts and pick the one we just created
        r2 = rq.get("http://localhost:5000/post")
        self.assertEqual(r2.status_code, 200)
        posts = r2.json().get('posts', [])
        self.assertTrue(len(posts) > 0)
        post = next((p for p in posts if p.get('title') == 'to-delete' and p.get('body') == 'please delete'), None)
        self.assertIsNotNone(post)
        post_id = post['id']

        # Delete by id
        r3 = rq.delete(f"http://localhost:5000/post/{post_id}")
        self.assertEqual(r3.status_code, 200)
        self.assertEqual(r3.json(), {'message': 'Post deleted successfully'})

        # Verify it's gone
        r4 = rq.get("http://localhost:5000/post")
        posts_after = r4.json().get('posts', [])
        self.assertFalse(any(p['id'] == post_id for p in posts_after))
    def get_token(self):
        body = {
            "email": "chintu@gmail.com",
            "password": "pass"
        }
        response = rq.post("http://localhost:5000/login", json=body)
        if response.status_code == 200:
            return response.json()['token']
        return None

    def test_update_post(self):
        response = rq.put("http://localhost:5000/post") 
        print(response.status_code)
        print(response.json())
        # We expect 401 because the user does not exist in the new DB
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'message': 'Post updated successfully'})

    def test_user_profile_get(self):
        # Relies on test_signup having run
        token = self.get_token()
        if not token:
            self.fail("Could not get token for profile test")
        
        headers = {'Authorization': f'Bearer {token}'}
        response = rq.get("http://localhost:5000/profile", headers=headers)
        print("GET /profile", response.status_code, response.json())
        self.assertEqual(response.status_code, 200)
        self.assertIn('user', response.json())
        self.assertEqual(response.json()['user']['email'], 'chintu@gmail.com')

    def test_user_profile_update(self):
        token = self.get_token()
        headers = {'Authorization': f'Bearer {token}'}
        body = {
            "email": "chintu_updated@gmail.com"
        }
        response = rq.put("http://localhost:5000/profile", json=body, headers=headers)
        print("PUT /profile", response.status_code, response.json())
        self.assertEqual(response.status_code, 200)
        
        # Verify update
        # Note: Previous token might be invalid if it encoded email. 
        # Check generateToken implementation.
        # Payload: { id: user.id, email: user.email }
        # If we update email, the old token has old email. But id is same.
        # authMiddleware verify uses secret. Logic uses decoded user.
        # Does it check DB? No.
        # So old token should still work for authentication, but 'req.user.email' will be old.
        # However, if we call GET /profile again, we fetch from DB using ID.
        
        response = rq.get("http://localhost:5000/profile", headers=headers)
        self.assertEqual(response.json()['user']['email'], 'chintu_updated@gmail.com')
        
        # Revert email for other tests/cleanup? 
        # Or just let it be. 'test_user_profile_delete' will delete it.

    def test_user_profile_z_delete(self):
        # Named with z to run last among profile tests
        # We need to login with NEW email if update was successful
        # But wait, get_token attempts login with 'chintu@gmail.com'. 
        # If update changed it to 'chintu_updated@gmail.com', get_token will fail.
        
        # Let's manually login with updated email
        body = {
            "email": "chintu_updated@gmail.com",
            "password": "pass"
        }
        response = rq.post("http://localhost:5000/login", json=body)
        if response.status_code != 200:
             # Maybe update failed or didn't run? Fallback
             body["email"] = "chintu@gmail.com"
             response = rq.post("http://localhost:5000/login", json=body)
        
        token = response.json().get('token')
        headers = {'Authorization': f'Bearer {token}'}
        
        response = rq.delete("http://localhost:5000/profile", headers=headers)
        print("DELETE /profile", response.status_code, response.json())
        self.assertEqual(response.status_code, 200)
        
        # Verify deletion
        response = rq.get("http://localhost:5000/profile", headers=headers)
        # Should be 404 or 401?
        # If user deleted, findById returns null -> 404 "User not found"
        self.assertEqual(response.status_code, 404)

if __name__ == '__main__':
    unittest.main()