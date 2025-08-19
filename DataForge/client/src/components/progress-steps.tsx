interface ProgressStepsProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Upload CSV" },
  { number: 2, label: "Configure" },
  { number: 3, label: "Process" },
  { number: 4, label: "Export" },
];

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center space-x-6">
          {steps.map((step, index) => {
            const isActive = currentStep >= step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <li key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive
                        ? "bg-primary-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isActive ? "text-primary-600" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="ml-6 w-6 h-px bg-gray-200"></div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
