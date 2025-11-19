export const loadRazorpay = () => {
  return new Promise(resolve => {
    if (typeof window === "undefined") return resolve(false);

    // If already loaded
    if (window.Razorpay) {
      return resolve(true);
    }

    // Create script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
