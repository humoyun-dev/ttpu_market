import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ErrorState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {message ?? "Something went wrong."}
        </p>
      </CardContent>
    </Card>
  );
}

