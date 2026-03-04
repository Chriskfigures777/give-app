/// <reference types="react" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "unit-elements-white-label-app": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "jwt-token"?: string;
          "customer-token"?: string;
          "settings-json"?: string;
          theme?: string;
          language?: string;
        },
        HTMLElement
      >;
      "unit-elements-application-form": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "application-form-id"?: string;
          "application-form-token"?: string;
          "jwt-token"?: string;
          "settings-json"?: string;
          theme?: string;
          language?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
