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

  const handleSubmit = () => {
    onSubmit();
    setShowSuccess(true);
  };

  const handleStartOver = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl space-y-8">
      {!showSuccess ? (
        <>
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            Confirm Your Details
          </h2>

          {schema.steps.slice(0, -1).map((step, index) => (
            <section key={step.title} className="border border-gray-200 rounded-xl p-6 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{step.title}</h3>
                <button
                  onClick={() => onEdit(index)}
                  className="text-gray-600 hover:text-black font-medium"
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {step.fields.map((field) => (
                  <FieldValueDisplay key={field.key} field={field} formData={formData} />
                ))}
              </div>
            </section>
          ))}

          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-black hover:bg-gray-800 text-white font-medium rounded-xl"
          >
            Submit
          </button>
        </>
      ) : (
        <>
          {/* Success */}
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Successfully Submitted</h2>
            <button
              onClick={handleStartOver}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
            >
              Start Over
            </button>
          </div>

          {/* EMI Calculator */}
          <div className="border-t pt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Care to calculate the cost?
            </h3>
            <EMICalculator />
          </div>
        </>
      )}
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
      <div className="col-span-full border-l-2 border-gray-200 pl-4 space-y-2">
        <div className="font-medium text-gray-800">{field.label}</div>
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

  if (displayValue === undefined || displayValue === null || displayValue === "") {
    displayValue = <span className="text-gray-400">Not provided</span>;
  }

  return (
    <div>
      <div className="text-sm text-gray-600 mb-1">{field.label}</div>
      <div className="font-medium text-gray-900">{displayValue}</div>
    </div>
  );
}

function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('8.5');
  const [loanTenure, setLoanTenure] = useState('20');
  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const calculateEMI = () => {
    const principal = parseFloat(loanAmount || '0');
    const rate = parseFloat(interestRate || '0') / 12 / 100;
    const tenure = parseFloat(loanTenure || '0') * 12;

    if (principal > 0 && rate > 0 && tenure > 0) {
      const emiAmount = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
      const totalPayment = emiAmount * tenure;
      const totalInterestPayment = totalPayment - principal;

      setEmi(Math.round(emiAmount));
      setTotalAmount(Math.round(totalPayment));
      setTotalInterest(Math.round(totalInterestPayment));
    }
  };

  useEffect(() => {
    calculateEMI();
  }, [loanAmount, interestRate, loanTenure]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">Loan Amount</label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            placeholder="₹ 50,00,000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-black outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Interest Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-black outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Tenure (Years)</label>
          <input
            type="number"
            value={loanTenure}
            onChange={(e) => setLoanTenure(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-black outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-gray-50 rounded-lg p-6">
        {loanAmount ? (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">EMI Calculation</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly EMI</span>
                <span className="font-bold text-xl">₹{emi.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Interest</span>
                <span className="font-medium">₹{totalInterest.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Enter loan details to calculate EMI
          </div>
        )}
      </div>
    </div>
  );
}