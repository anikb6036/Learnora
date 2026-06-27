async function test() {
  try {
    const result = await fetch("https://google.com");
    console.log("google.com", result.status);
  } catch(e) {
    console.log("google.com error", e.message);
  }
}
test();
