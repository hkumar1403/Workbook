// TODAY() → returns today's date as "DD-MM-YYYY"

module.exports = function TODAY() {
  const now = new Date();

  // Format: YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${day}-${month}-${year}`;
};
