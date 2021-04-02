const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");

const validateRegisterInput = (username, email, password, confirmPassword) => {
    let errors = {};

    if (username.trim() === "") {
        errors.username = "Username must not be empty";
    }

    if (email.trim() === "") {
        errors.email = "Email must not be empty";
    } else {
        const regEx = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
        if (!email.match(regEx)) {
            errors.email = "Invalid Email Address";
        }
    }

    if (password === "") {
        errors.password = "Password must not be empty";
    }
    if (password !== confirmPassword) {
        errors.password = "Password must match";
    }

    return {
        errors,
        valid: Object.keys(errors).length,
    };
};

const validateLoginUser = (username, password) => {
    let errors = {};
    if (username.trim() === "") {
        errors.username = "Username must not be empty";
    }
    if (password === "") {
        errors.password = "Password must not be empty";
    }
    return {
        errors,
        valid: Object.keys(errors).length,
    };
};

module.exports = {
    Mutation: {
        register: async(
            _, { registerInput: { username, email, password, confirmPassword } },
            context,
            info
        ) => {
            // TODO: validate data
            const checkError = validateRegisterInput(
                username,
                email,
                password,
                confirmPassword
            );
            if (checkError.valid) {
                throw new UserInputError("Error Found", {
                    error: checkError.errors,
                });
            }

            // Unique Username Check
            const userCheck = await User.findOne({
                username,
            });

            if (userCheck) {
                throw new UserInputError("Username is taken", {
                    error: {
                        username: "This username is taken",
                    },
                });
            }

            // Hash Password
            password = await bcrypt.hash(password, 12);

            // Create User
            const user = new User({
                username,
                email,
                password,
            });

            const res = await user.save();

            // Create Token
            const token = jwt.sign({
                    id: res.id,
                    email: res.email,
                    username: res.username,
                },
                process.env.SECRET_KEY, {
                    expiresIn: "1h",
                }
            );

            return {
                token,
                id: res._id,
                createdAt: res.createdAt,
                email: res.email,
            };
        },
        login: async(_, { username, password }) => {
            const { errors, valid } = validateLoginUser(username, password);

            if (valid) {
                throw new UserInputError("Error Found", {
                    error: errors,
                });
            }

            const user = await User.findOne({
                username: username,
            });

            if (!user) {
                throw new UserInputError("User not found", {
                    errors,
                });
            }

            const matchPassword = await bcrypt.compare(password, user.password);
            if (!matchPassword) {
                throw new UserInputError("Wrong Credentials", {
                    error: "Wrong Password",
                });
            }

            const token = jwt.sign({
                    username,
                    password,
                },
                process.env.SECRET_KEY
            );

            return {
                token,
                email: user.email,
                id: user._id,
                createdAt: user.createdAt,
            };
        },
    },
};