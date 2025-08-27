"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldTransformationsList } from "./transformations/field-transformations-list";
import { TransformationRulesList } from "./transformations/transformation-rules-list";
import { CreateFieldTransformationForm } from "@/forms/transformations/create-field-transformation-form";
import { CreateTransformationRuleForm } from "@/forms/transformations/create-transformation-rule-form";

type TabType = "transformations" | "rules";

export function TransformationDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("transformations");
  const [showCreateTransformation, setShowCreateTransformation] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("transformations")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "transformations"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Field Transformations
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "rules"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Transformation Rules
        </button>
      </div>

      {/* Field Transformations Tab */}
      {activeTab === "transformations" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Field Transformations</h2>
              <p className="text-muted-foreground mt-1">
                Create reusable transformations that can be applied to dispatch fields
              </p>
            </div>
            <Button onClick={() => setShowCreateTransformation(true)}>
              Create Transformation
            </Button>
          </div>
          <FieldTransformationsList />
        </Card>
      )}

      {/* Transformation Rules Tab */}
      {activeTab === "rules" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Transformation Rules</h2>
              <p className="text-muted-foreground mt-1">
                Define rules that match dispatches and apply transformations
              </p>
            </div>
            <Button onClick={() => setShowCreateRule(true)}>
              Create Rule
            </Button>
          </div>
          <TransformationRulesList />
        </Card>
      )}

      {/* Modal Forms */}
      <CreateFieldTransformationForm 
        open={showCreateTransformation}
        onClose={() => setShowCreateTransformation(false)}
      />
      
      <CreateTransformationRuleForm 
        open={showCreateRule}
        onClose={() => setShowCreateRule(false)}
      />
    </div>
  );
}