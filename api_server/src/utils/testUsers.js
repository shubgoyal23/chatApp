import crypto from "node:crypto";
import { User } from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import { Message } from "../models/message.model.js";
import { Redisclient, redisKey } from "../db/Redis.js";

// Shared demo accounts, available when TEST_USERS_ENABLED=true. They sign in
// through /users/test-login without a password, so they must never hold
// anything private and are protected from profile/password changes.
export const TEST_USERS = [
   { username: "alice.test", fullname: "Alice (Test)", avatar: "chat/qhqxqat0tvalbk0q0qt6", about: "Test account — say hi!" },
   { username: "bob.test", fullname: "Bob (Test)", avatar: "chat/zw21cp75dkgwteyyd9h6", about: "Test account — try a video call." },
   { username: "carol.test", fullname: "Carol (Test)", avatar: "chat/jnagmjo3yambupz6l2e5", about: "Test account — groups are fun." },
];

const GROUP_USERNAME = "test.lounge";

export const testUsersEnabled = () => process.env.TEST_USERS_ENABLED === "true";

// unguessable, valid per the password policy; nobody needs to know it
const randomPassword = () => `Tt1!${crypto.randomBytes(24).toString("hex")}`;

/** Creates the test accounts, a shared group and a few starter messages. Idempotent. */
export async function seedTestUsers() {
   const users = [];
   for (const t of TEST_USERS) {
      let user = await User.findOne({ username: t.username });
      if (user && !user.isTestUser) {
         console.warn(`test users: "${t.username}" belongs to a real account, skipping`);
         continue;
      }
      if (!user) {
         user = await User.create({
            ...t,
            email: `${t.username.replace(".", "-")}@example.com`,
            password: randomPassword(),
            verified: true,
            isTestUser: true,
            accountType: "user",
         });
      } else {
         // undo any drift so every visitor gets the same demo
         Object.assign(user, t, { verified: true });
         await user.save({ validateBeforeSave: false });
      }
      users.push(user);
   }
   if (users.length < 2) return;
   const ids = users.map((u) => u._id);

   let group = await Group.findOne({ username: GROUP_USERNAME });
   if (!group) {
      group = await Group.create({
         fullname: "Test Lounge",
         username: GROUP_USERNAME,
         about: "A shared group for the test accounts.",
         members: ids,
         admins: [ids[0]],
         createdBy: ids[0],
         accountType: "group",
      });
   } else {
      const missing = ids.filter((id) => !group.members.some((m) => m.equals(id)));
      if (missing.length) {
         group.members.push(...missing);
         await group.save();
      }
   }
   await Redisclient.sAdd(redisKey(`group:${group._id}`), group.members.map(String));

   if (!(await Message.exists({ to: group._id }))) {
      const now = Math.floor(Date.now() / 1000);
      const [a, b, c] = users;
      await Message.insertMany([
         { from: a._id, to: b._id, type: "user", message: "Hey Bob! This is a test conversation 👋", epoch: now - 120 },
         { from: b._id, to: a._id, type: "user", message: "Hi Alice! Try opening me in another browser and calling.", epoch: now - 90 },
         { from: a._id, to: group._id, type: "group", message: "Welcome to the Test Lounge 🎉", epoch: now - 60 },
         ...(c ? [{ from: c._id, to: group._id, type: "group", message: "Glad to be here!", epoch: now - 30 }] : []),
      ]);
   }
   console.log(`test users ready: ${users.map((u) => u.username).join(", ")}`);
}
