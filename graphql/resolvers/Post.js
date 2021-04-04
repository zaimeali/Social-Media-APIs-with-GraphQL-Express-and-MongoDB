const Post = require("./../../models/Post");
const jwt = require("jsonwebtoken");
const { AuthenticationError, UserInputError } = require("apollo-server");

const checkAuth = (context) => {
    const authHeader = context.req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split("Bearer ")[1];
        if (token) {
            try {
                const user = jwt.verify(token, process.env.SECRET_KEY);
                return user;
            } catch (e) {
                throw new AuthenticationError("Invalid/Expired Token");
            }
        } else {
            throw new Error("Invalid token found");
        }
    } else {
        throw new Error("No Token Found");
    }
};

module.exports = {
    Query: {
        getPosts: async() => {
            try {
                const posts = await Post.find().sort({ createdAt: "desc" });
                return posts;
            } catch (e) {
                throw new Error(e);
            }
        },
        getPost: async(_, { postId }) => {
            try {
                const post = await Post.findById(postId);
                if (post) {
                    return post;
                } else {
                    throw new Error("Post not found");
                }
            } catch (e) {
                throw new Error(e);
            }
        },
    },
    Mutation: {
        createPost: async(_, { body }, context) => {
            try {
                const user = checkAuth(context);
                if (user) {
                    const newPost = new Post({
                        body,
                        user: user.id,
                        username: user.username,
                    });

                    const post = await newPost.save();

                    console.log();

                    return {
                        id: post._id,
                        body: post.body,
                        username: post.username,
                        comments: post.comments,
                        likes: post.likes,
                        updatedAt: new Date(`${post.updatedAt}`).toString(),
                        createdAt: new Date(`${post.createdAt}`).toString(),
                    };
                }
            } catch (e) {
                throw new Error(e);
            }
        },
        deletePost: async(_, { postId }, context) => {
            try {
                const user = checkAuth(context);
                if (user) {
                    const post = await Post.findById(postId);
                    if (user.username === post.username) {
                        await post.delete();
                        return "Post Deleted";
                    } else {
                        throw new AuthenticationError("User is different so can't delete");
                    }
                }
            } catch (e) {
                throw new Error(e);
            }
        },
        createComment: async(_, { postId, body }, context) => {
            const user = checkAuth(context);
            if (user) {
                if (body.trim() === "") {
                    throw new UserInputError("Empty Comment", {
                        error: "Comment should not be empty",
                    });
                } else {
                    const post = await Post.findById(postId);

                    if (post) {
                        post.comments.unshift({
                            body,
                            username: user.username,
                        });

                        await post.save();
                        return post;
                    } else {
                        throw new Error("Post Not Found");
                    }
                }
            } else {
                throw new AuthenticationError("You should have logged in to comment");
            }
        },
        deleteComment: async(_, { postId, commentId }, context) => {
            const user = checkAuth(context);

            if (user) {
                const post = await Post.findById(postId);
                if (post) {
                    const commentIndex = post.comments.findIndex(
                        (c) => c.id === commentId
                    );
                    if (post.comments[commentIndex].username === user.username) {
                        post.comments.splice(commentIndex, 1);
                        await post.save();
                        return post;
                    } else {
                        throw new Error("You cannot delete, this post is not yours");
                    }
                } else {
                    throw new UserInputError("No Post Found");
                }
            } else {
                throw new AuthenticationError("You should be logged in boy");
            }
        },
        likePost: async(_, { postId }, context) => {
            const user = checkAuth(context);
            if (user) {
                const post = await Post.findById(postId);
                if (post) {
                    const findIndex = post.likes.find(
                        (like) => like.username === user.username
                    );

                    console.log(findIndex);
                    if (findIndex) {
                        post.likes = post.likes.filter(
                            (like) => like.username !== user.username
                        );
                    } else {
                        post.likes.push({
                            username: user.username,
                        });
                    }
                    await post.save();
                    return post;
                } else {
                    throw new Error("No Post Found");
                }
            } else {
                throw new AuthenticationError("You have to logged in");
            }
        },
    },
};