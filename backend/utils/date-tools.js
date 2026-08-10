import moment from "moment-timezone";

export const toDateString = (t) => {
  // t: 可以是 Date 類型
  const m = moment(t);
  if (m.isValid()) {
    return m.format("YYYY-MM-DD");
  } else {
    return "";
  }
};
export const toDateTimeString = () => {
  const m = moment(t);
  if (m.isValid()) {
    return m.format("YYYY-MM-DD HH:mm:ss");
  } else {
    return "";
  }
};
