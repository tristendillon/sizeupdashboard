import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { Shield, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardV2Page() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/dashboardv2/hydrants">
                <Zap className="mr-3 size-5" />
                <div className="text-left">
                  <div className="font-medium">Manage Hydrants</div>
                  <div className="text-muted-foreground text-xs">
                    View hydrant status
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/dashboardv2/dispatch-types">
                <Shield className="mr-3 size-5" />
                <div className="text-left">
                  <div className="font-medium">Dispatch Types</div>
                  <div className="text-muted-foreground text-xs">
                    Configure categories
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/dashboardv2/field-transformations">
                <TrendingUp className="mr-3 size-5" />
                <div className="text-left">
                  <div className="font-medium">Data Transforms</div>
                  <div className="text-muted-foreground text-xs">
                    Field transformations
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/dashboardv2/view-tokens">
                <Users className="mr-3 size-5" />
                <div className="text-left">
                  <div className="font-medium">View Access</div>
                  <div className="text-muted-foreground text-xs">
                    Token management
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <DashboardContent />
    </div>
  );
}
