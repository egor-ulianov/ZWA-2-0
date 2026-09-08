function clsx(...values) {
  return values.filter(Boolean).join(" ");
}

module.exports = { clsx };
