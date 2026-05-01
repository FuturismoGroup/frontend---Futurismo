import { CheckIcon } from '@heroicons/react/24/outline';

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Mobile version - vertical */}
      <div className="sm:hidden">
        <div className="flex flex-col space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.number} className="flex items-center">
                <div
                  className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0
                    ${isCompleted 
                      ? 'bg-primary-600 text-white' 
                      : isActive 
                        ? 'bg-primary-100 text-primary-600 border-2 border-primary-600' 
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {!isLast && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200">
                    <div
                      className="w-full bg-primary-600 transition-all duration-300"
                      style={{ height: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop version - horizontal */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full
                    ${isCompleted 
                      ? 'bg-primary-600 text-white' 
                      : isActive 
                        ? 'bg-primary-100 text-primary-600 border-2 border-primary-600' 
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {!isLast && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-200">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;