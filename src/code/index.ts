// import AuthenticationAdapter, { type AuthAdapterOptions } from "./auth/AuthenticationAdapter.js";
// import db from "./db/Db.js";
// import UserAdapter from "./user/UserAdapter.js";

// const authAdapterOptions: AuthAdapterOptions = {
//   jwtSecret: "your_jwt_secret_key",
//   tokenTtlSeconds: 60 * 60 * 24, // 1 day
//   bcryptSaltRounds: 10,
// };

// const authenticationAdapter = new AuthenticationAdapter(authAdapterOptions);
// const userAdapter = new UserAdapter(db);

// userAdapter.create({ id: 1, username: "john_doe", password: "password123" });

// const user = await userAdapter.findByUsername("john_doe");
// console.log("User found:", user);

// const token = await authenticationAdapter.generateToken({ userId: user.id, username: user.username });
// console.log("Generated JWT:", token);

// const decodedToken = await authenticationAdapter.validateToken(token.token);
// console.log("Decoded JWT:", decodedToken);
