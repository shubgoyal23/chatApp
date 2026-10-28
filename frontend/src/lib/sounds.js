// Short UI sounds for sent and received messages.
const SOURCES = {
   sent: "/sounds/message-sent.mp3",
   received: "/sounds/message-received.mp3",
};
const VOLUME = 0.6;
// a burst of messages (e.g. delivered after reconnecting) plays one sound
const MIN_GAP = 700;

const audio = {};
const lastPlayed = {};

export function playSound(name) {
   const now = Date.now();
   if (now - (lastPlayed[name] ?? 0) < MIN_GAP) return;
   lastPlayed[name] = now;
   try {
      const a = (audio[name] ??= Object.assign(new Audio(SOURCES[name]), { preload: "auto", volume: VOLUME }));
      a.currentTime = 0;
      // browsers block sound until the user has interacted with the page
      a.play().catch(() => {});
   } catch {
      // audio unavailable
   }
}
