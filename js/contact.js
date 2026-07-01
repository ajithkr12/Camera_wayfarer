// Central Contact Form System — API config
const API_ENDPOINT = "http://localhost:8082/api/submit.php";
const API_KEY = "A749E1390A8E45FC5B91CC9063916FB5";

const form = document.getElementById("contactForm");
const btn = document.getElementById("submitBtn");
const alertOk = document.getElementById("alertSuccess");
const alertErr = document.getElementById("alertError");
const successMsg = document.getElementById("successMsg");
const errorMsg = document.getElementById("errorMsg");

function showAlert(type, message) {
  alertOk.classList.remove("show");
  alertErr.classList.remove("show");
  if (type === "success") {
    successMsg.textContent = message;
    alertOk.classList.add("show");
  } else {
    errorMsg.textContent = message;
    alertErr.classList.add("show");
  }
}

function setLoading(on) {
  btn.disabled = on;
  btn.classList.toggle("loading", on);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const subject = " New Contact Form Submission";
  const message = form.message.value.trim();

  if (!name || !email || !message) {
    showAlert("error", "Please fill in all required fields.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert("error", "Please enter a valid email address.");
    return;
  }

  setLoading(true);
  alertOk.classList.remove("show");
  alertErr.classList.remove("show");

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: API_KEY,
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
        page_url: window.location.href,
      }),
    });

    const data = await res.json();

    if (res.ok && data.status === "success") {
      showAlert("success", data.message);
      form.reset();
    } else {
      showAlert(
        "error",
        data.message || "Submission failed. Please try again.",
      );
    }
  } catch {
    showAlert(
      "error",
      "Network error. Please check your connection and try again.",
    );
  } finally {
    setLoading(false);
  }
});
