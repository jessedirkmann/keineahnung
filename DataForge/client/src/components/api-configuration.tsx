import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnrichmentConfig {
  apiKey: string;
  model: string;
  concurrency: number;
}

interface ApiConfigurationProps {
  config: EnrichmentConfig;
  onConfigChange: (config: EnrichmentConfig) => void;
}

export function ApiConfiguration({ config, onConfigChange }: ApiConfigurationProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);
  const { toast } = useToast();

  const validateApiKey = async () => {
    if (!config.apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key first.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/validate-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: config.apiKey }),
      });

      const data = await response.json();
      setValidationResult(data.valid);

      if (data.valid) {
        toast({
          title: "API Key Valid",
          description: "Your OpenAI API key has been validated successfully.",
        });
      } else {
        toast({
          title: "Invalid API Key",
          description: "Please check your OpenAI API key and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setValidationResult(false);
      toast({
        title: "Validation Error",
        description: "Failed to validate API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>

        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
                placeholder="sk-..."
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {validationResult !== null && (
                  validationResult ? (
                    <CheckCircle className="w-4 h-4 text-success-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-error-500" />
                  )
                )}
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your API key is stored locally and never sent to our servers
            </p>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Model</Label>
            <Select value={config.model} onValueChange={(value) => onConfigChange({ ...config, model: value })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Concurrency</Label>
            <Select 
              value={config.concurrency.toString()} 
              onValueChange={(value) => onConfigChange({ ...config, concurrency: parseInt(value) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 parallel requests</SelectItem>
                <SelectItem value="10">10 parallel requests</SelectItem>
                <SelectItem value="20">20 parallel requests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={validateApiKey}
            disabled={isValidating || !config.apiKey}
            className="w-full"
            variant={validationResult === true ? "default" : "outline"}
          >
            {isValidating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : validationResult === true ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {isValidating ? "Validating..." : validationResult === true ? "API Key Valid" : "Validate API Key"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
