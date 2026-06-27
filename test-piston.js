async function test() {
    try {
      const result = await fetch("https://piston.dev/api/v2/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "javascript", version: "*", files: [{ content: "console.log(1);" }] }),
        redirect: "manual"
      });
      console.log(result.status, result.headers.get("location"));
    } catch (e) {
      console.log(e.message, e.cause);
    }
}
test();
