// utils/loadRazorpay.ts

// Singleton promise to prevent multiple simultaneous loads
let razorpayLoadingPromise: Promise<boolean> | null = null;

/**
 * Loads the Razorpay checkout script dynamically.
 * Returns a promise that resolves to true if loaded successfully, false otherwise.
 * Implements singleton pattern to prevent duplicate script loads.
 */
export const loadRazorpay = (): Promise<boolean> => {
  // Server-side check
  if (typeof window === "undefined") {
    console.warn("⚠️ loadRazorpay called on server-side");
    return Promise.resolve(false);
  }

  // Already loaded
  if (window.Razorpay) {
    console.log("✅ Razorpay already loaded");
    return Promise.resolve(true);
  }

  // Already loading (return existing promise)
  if (razorpayLoadingPromise) {
    console.log("⏳ Razorpay loading in progress...");
    return razorpayLoadingPromise;
  }

  // Check if script tag already exists (from previous attempt)
  const existingScript = document.querySelector(
    'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
  );

  if (existingScript) {
    console.log("🔄 Razorpay script tag exists, waiting for load...");
    
    // Create promise that waits for existing script
    razorpayLoadingPromise = new Promise((resolve) => {
      // Check if already loaded (race condition)
      if (window.Razorpay) {
        resolve(true);
        razorpayLoadingPromise = null;
        return;
      }

      // Wait for load
      const onLoad = () => {
        console.log("✅ Razorpay loaded successfully");
        resolve(true);
        razorpayLoadingPromise = null;
        cleanup();
      };

      const onError = () => {
        console.error("❌ Razorpay failed to load");
        resolve(false);
        razorpayLoadingPromise = null;
        cleanup();
      };

      const cleanup = () => {
        existingScript.removeEventListener("load", onLoad);
        existingScript.removeEventListener("error", onError);
      };

      existingScript.addEventListener("load", onLoad);
      existingScript.addEventListener("error", onError);

      // Timeout fallback (10 seconds)
      setTimeout(() => {
        if (!window.Razorpay) {
          console.error("⏰ Razorpay load timeout");
          cleanup();
          resolve(false);
          razorpayLoadingPromise = null;
        }
      }, 10000);
    });

    return razorpayLoadingPromise;
  }

  // Create new script tag
  console.log("📥 Loading Razorpay script...");
  
  razorpayLoadingPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.setAttribute("data-razorpay-loader", "true");

    const onLoad = () => {
      console.log("✅ Razorpay loaded successfully");
      resolve(true);
      razorpayLoadingPromise = null;
      cleanup();
    };

    const onError = (error: Event) => {
      console.error("❌ Razorpay script failed to load:", error);
      
      // Remove failed script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      resolve(false);
      razorpayLoadingPromise = null;
      cleanup();
    };

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    // Timeout fallback (10 seconds)
    setTimeout(() => {
      if (!window.Razorpay) {
        console.error("⏰ Razorpay load timeout after 10s");
        onError(new Event("timeout"));
      }
    }, 10000);

    document.body.appendChild(script);
  });

  return razorpayLoadingPromise;
};

/**
 * Utility to check if Razorpay is currently loaded
 */
export const isRazorpayLoaded = (): boolean => {
  return typeof window !== "undefined" && !!window.Razorpay;
};

/**
 * Utility to unload Razorpay (useful for cleanup in tests)
 */
export const unloadRazorpay = (): void => {
  if (typeof window === "undefined") return;

  // Remove script tags
  const scripts = document.querySelectorAll(
    'script[src*="checkout.razorpay.com"]'
  );
  scripts.forEach((script) => script.remove());

  // Clear window object
  if (window.Razorpay) {
    delete window.Razorpay;
  }

  // Reset loading promise
  razorpayLoadingPromise = null;

  console.log("🗑️ Razorpay unloaded");
};