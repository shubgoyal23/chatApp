export function convertTime(date) {
   const dateTime = new Date(0);
   dateTime.setUTCSeconds(date);
   let hr = dateTime.getHours();
   let min = dateTime.getMinutes();
   let noon = "AM";

   if (hr > 12) {
      hr = hr - 12;
      noon = "PM";
   }
   if (min < 10) {
      min = `0${min}`;
   }
   return `${hr}:${min}${noon}`;
}

const months = [
   "Jan",
   "Feb",
   "Mar",
   "Apr",
   "May",
   "Jun",
   "Jul",
   "Aug",
   "Sep",
   "Oct",
   "Nov",
   "Dec",
];

export function convertDate(date) {
   const dateTime = new Date(0);
   dateTime.setUTCSeconds(date);
   let day = dateTime.getDate();
   let month = dateTime.getMonth();
   let year = dateTime.getFullYear();

   if (day < 10) {
      day = `0${day}`;
   }
   month = months[month];

   return `${day} ${month} ${year}`;
}
