import React, { useState, useEffect } from "react";
import { FormSchema, FormDataState, FieldSchema } from "@/types/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
    <div className="max-w-4xl mx-auto p-8 bg-white space-y-10">
      {!showSuccess ? (
        <>
          <h2 className="text-3xl font-semibold text-gray-900 text-center tracking-tight">
            Confirm Your Details
          </h2>

          {schema.steps.slice(0, -1).map((step, index) => (
            <section
              key={step.title}
              className="border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-semibold text-gray-800 tracking-wide">{step.title}</h3>
                <button
                  onClick={() => onEdit(index)}
                  className="text-gray-600 hover:text-gray-900 font-semibold transition-colors duration-200"
                  aria-label={`Edit ${step.title}`}
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {step.fields.map((field) => (
                  <FieldValueDisplay key={field.key} field={field} formData={formData} />
                ))}
              </div>
            </section>
          ))}

          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl shadow-md transition-colors duration-300"
          >
            Submit
          </button>
        </>
      ) : (
        <>
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-md">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 tracking-tight">
              Successfully Submitted
            </h2>
            <button
              onClick={handleStartOver}
              className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm transition-colors duration-200"
            >
              Start Over
            </button>
          </div>
          <div className="border-t pt-10">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center tracking-tight">
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
      <div className="col-span-full border-l-2 border-gray-200 pl-5 space-y-3">
        <div className="font-semibold text-gray-800 tracking-wide">{field.label}</div>
        {field.fields.map((subField) => (
          <FieldValueDisplay
            key={subField.key}
            field={subField}
            formData={formData}
            parentKey={field.key}
          />
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
    displayValue = <span className="text-gray-400 italic">Not provided</span>;
  }

  return (
    <div>
      <div className="text-sm text-gray-600 mb-1 tracking-wide">{field.label}</div>
      <div className="font-semibold text-gray-900">{displayValue}</div>
    </div>
  );
}

function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('4.5');
  const [loanTenure, setLoanTenure] = useState('25');
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
    } else {
      setEmi(0);
      setTotalAmount(0);
      setTotalInterest(0);
    }
  };

  useEffect(() => {
    calculateEMI();
  }, [loanAmount, interestRate, loanTenure]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-wide">Loan Details</CardTitle>
          <CardDescription>Enter your loan information below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="loanAmount" className="font-medium">Loan Amount</Label>
            <Input
              id="loanAmount"
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="AED 1,500,000"
              className="rounded-lg border-gray-300 focus:border-black focus:ring-1 focus:ring-black transition"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="interestRate" className="font-medium">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="rounded-lg border-gray-300 focus:border-black focus:ring-1 focus:ring-black transition"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="loanTenure" className="font-medium">Tenure (Years)</Label>
            <Input
              id="loanTenure"
              type="number"
              value={loanTenure}
              onChange={(e) => setLoanTenure(e.target.value)}
              className="rounded-lg border-gray-300 focus:border-black focus:ring-1 focus:ring-black transition"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-wide">EMI Calculation</CardTitle>
          <CardDescription>Your monthly payment breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {loanAmount && parseFloat(loanAmount) > 0 ? (
            <div className="space-y-6">
              <div className="text-center p-6 bg-slate-50 rounded-lg shadow-sm overflow-auto">
                <p className="text-sm text-gray-600 mb-1 tracking-wide">Monthly EMI</p>
                <p className="text-3xl font-bold text-gray-900">
                  AED {emi.toLocaleString('en-AE')}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-center">
  <div className="flex flex-col items-center space-y-1 px-3">
    <Badge variant="outline" className="text-sm tracking-wide whitespace-nowrap">
      Total Interest
    </Badge>
    <p className="font-semibold text-gray-800">AED {totalInterest.toLocaleString('en-AE')}</p>
  </div>

  <div className="flex flex-col items-center space-y-1 px-3">
    <Badge variant="outline" className="text-sm tracking-wide whitespace-nowrap">
      Total Amount
    </Badge>
    <p className="font-semibold text-gray-800">AED {totalAmount.toLocaleString('en-AE')}</p>
  </div>
</div>

            </div>
          ) : (
            <div className="text-center text-gray-400 py-10 tracking-wide italic">
              Enter loan details to calculate EMI
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
