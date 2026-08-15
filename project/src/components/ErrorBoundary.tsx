import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-stone-950">
          <Card className="max-w-md text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              {this.state.error?.message || "An unexpected error occurred while rendering this page."}
            </p>
            <Button onClick={this.handleReset} className="mt-6">
              <RefreshCw className="h-4 w-4" /> Refresh Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
