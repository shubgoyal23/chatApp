// const conf = {
//     WS_URL: "ws://localhost:3000",
//     API_URL: "http://localhost:8000/api/v1",
//     GIN_URL: "http://localhost:3000"
// }
const conf = {
   WS_URL: import.meta.env.VITE_WS_URL,
   API_URL: import.meta.env.VITE_API_URL,
   GIN_URL: import.meta.env.VITE_GIN_URL,
};
export default conf;
