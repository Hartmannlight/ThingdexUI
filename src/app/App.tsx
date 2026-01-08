import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/app/routes";
import { AudioFeedbackProvider } from "@/hooks/useAudioFeedback";
import { ToastsProvider } from "@/hooks/useToasts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioFeedbackProvider>
        <ToastsProvider>
          <RouterProvider router={router} />
        </ToastsProvider>
      </AudioFeedbackProvider>
    </QueryClientProvider>
  );
};

export default App;
