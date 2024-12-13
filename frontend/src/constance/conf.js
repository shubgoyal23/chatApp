// const conf = {
//     WS_URL: "ws://localhost:3000",
//     API_URL: "http://localhost:8000/api/v1",
//     GIN_URL: "http://localhost:3000"
// }
const conf = {
   WS_URL: process.env.WS_URL,
   API_URL: process.env.API_URL,
   GIN_URL: process.env.GIN_URL,
};
export default conf;
