import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

// import { MsalProvider } from "@azure/msal-react";
// import { PublicClientApplication } from "@azure/msal-browser";
// import { msalConfig } from "@/config/authConfig";
// import "@/styles/globals.css";

// // Create MSAL instance
// const msalInstance = new PublicClientApplication(msalConfig);

// export default function App({ Component, pageProps }) {
//   return (
//     <MsalProvider instance={msalInstance}>
//       <Component {...pageProps} />
//     </MsalProvider>
//   );
// }