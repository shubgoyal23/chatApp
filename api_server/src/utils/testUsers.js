import { User } from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import { Message } from "../models/message.model.js";
import { Redisclient, redisKey } from "../db/Redis.js";

// Ready-made accounts for trying the app, created when TEST_USERS_ENABLED=true.
// They are ordinary accounts that sign in with TEST_USERS_PASSWORD; the login
// page lists them so people can fill in the form with one click.
export const TEST_USERS = [
   { username: "alice.test", fullname: "Alice (Test)", avatar: "chat/qhqxqat0tvalbk0q0qt6", about: "Test account — say hi!" },
   { username: "bob.test", fullname: "Bob (Test)", avatar: "chat/zw21cp75dkgwteyyd9h6", about: "Test account — try a video call." },
   { username: "carol.test", fullname: "Carol (Test)", avatar: "chat/jnagmjo3yambupz6l2e5", about: "Test account — groups are fun." },
];

const GROUP_USERNAME = "test.lounge";

export const testUsersEnabled = () => process.env.TEST_USERS_ENABLED === "true";

// Shared password shown on the login page; must satisfy the password policy.
export const testUsersPassword = () => process.env.TEST_USERS_PASSWORD || "Test@1234";

/** Creates any missing test accounts, a shared group and a few starter messages. */
export async function seedTestUsers() {
   const users = [];
   let created = 0;
   for (const t of TEST_USERS) {
      // matched by email, which stays put even if the username is edited
      const email = `${t.username.replace(".", "-")}@example.com`;
      let user = await User.findOne({ email });
      if (user && !user.isTestUser) {
         console.warn(`test users: ${email} belongs to a real account, skipping`);
         continue;
      }
      if (!user) {
         if (await User.exists({ username: t.username })) {
            console.warn(`test users: username "${t.username}" is taken, skipping`);
            continue;
         }
         user = await User.create({
            ...t,
            email,
            password: testUsersPassword(),
            verified: true,
            isTestUser: true,
            accountType: "user",
         });
         created++;
      }
      users.push(user);
   }
   if (users.length) {
      console.log(`test users ready: ${users.map((u) => u.username).join(", ")}`);
   }
   // starter group and messages only on first creation, so later edits stick
   if (!created || users.length < 2) return;

   const ids = users.map((u) => u._id);
   const group =
      (await Group.findOne({ username: GROUP_USERNAME })) ??
      (await Group.create({
         fullname: "Test Lounge",
         username: GROUP_USERNAME,
         about: "A shared group for the test accounts.",
         members: ids,
         admins: [ids[0]],
         createdBy: ids[0],
         accountType: "group",
      }));
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
}
