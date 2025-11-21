
// NOW() → returns current date + time formatted as DD-MM-YYYY HH:MM:SS

module.exports = function NOW() {
  const now = new Date();

  // Extract pieces
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");  // Months are 0-based
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Build final string
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};
