import React, { useState, useEffect } from "react";
import { FormSchema, FormDataState, FieldSchema } from "@/types/schema";

interface ConfirmationPageProps {
  formData: FormDataState;
  schema: FormSchema;
  onEdit: (stepIndex: number) => void;
  onSubmit: () => void;
}

export default function ConfirmationPage({
  formData,
  schema,
  onEdit,
  onSubmit,
}: ConfirmationPageProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  // useEffect(() => {
  //   console.log("=== CONFIRMATION PAGE DATA ===");
  //   console.log("Form Data:", formData);
  // }, [formData, schema]);

  const handleSubmit = () => {
    onSubmit();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    

    setTimeout(() => {
        setShowSuccess(false);
        window.location.reload();
      }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl  ring-gray-200 space-y-10">
      <h2 className="text-4xl font-extrabold text-gray-900 text-center tracking-tight">
        Confirm Your Details
      </h2>

      {schema.steps.slice(0, -1).map((step, index) => (
        <section
          key={step.title}
          className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-2xl font-semibold text-gray-800">{step.title}</h3>
            <button
              onClick={() => onEdit(index)}
              className="text-indigo-600 hover:text-indigo-900 font-medium transition"
              aria-label={`Edit ${step.title}`}
            >
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 text-gray-700">
            {step.fields.map((field) => (
              <FieldValueDisplay key={field.key} field={field} formData={formData} />
            ))}
          </div>
        </section>
      ))}

      <button
        onClick={handleSubmit}
        className="w-full py-4 bg-black hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg transition duration-300"
        aria-label="Submit Confirmation"
      >
        Submit
      </button>

      {showSuccess && <SuccessAnimation />}
    </div>
  );
}

function FieldValueDisplay({
  field,
  formData,
  parentKey = "", 
}: {
  field: FieldSchema;
  formData: FormDataState;
  parentKey?: string;
}) {
  if (field.type === "group" && field.fields) {
    return (
      <div className="col-span-full pl-6 border-l-4 border-indigo-200 space-y-2">
        <div className="font-semibold text-indigo-800">{field.label}</div>
        {field.fields.map((subField) => (
          <FieldValueDisplay key={subField.key} field={subField} formData={formData} parentKey={field.key} />
        ))}
      </div>
    );
  }

  const fieldKey = parentKey ? `${parentKey}.${field.key}` : field.key;
  let displayValue = formData[fieldKey];

  if (field.type === "checkbox") {
    displayValue = displayValue ? "Yes" : "No";
  }

  if (
    displayValue === undefined ||
    displayValue === null ||
    displayValue === ""
  ) {
    displayValue = (
      <span className="italic text-gray-400 select-none">Not provided</span>
    );
  }

  return (
    <>
      <div className="font-semibold">{field.label}:</div>
      <div className="break-words">{displayValue}</div>
    </>
  );
}
function SuccessAnimation() {
    return (
      <>
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm z-50 pointer-events-none">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center space-y-6 shadow-2xl pointer-events-auto max-w-sm mx-4">
            <svg
              className="w-20 h-20 text-green-500 animate-checkmark"
              viewBox="0 0 52 52"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                className="checkmark__check"
                d="M14 27l7 7 17-17"
                strokeDasharray="48"
                strokeDashoffset="48"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="48"
                  to="0"
                  dur="0.5s"
                  fill="freeze"
                />
              </path>
            </svg>
            <p className="text-2xl font-semibold text-green-600 select-none text-center">
              Successfully Submitted!
            </p>
          </div>
        </div>
  
        <style jsx>{`
          @keyframes checkmark {
            0% {
              stroke-dashoffset: 48;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
  
          .animate-checkmark {
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: checkmark 0.5s forwards;
          }
        `}</style>
      </>
    );
  }
  