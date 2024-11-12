import React, { useMemo } from 'react';
import { Clock, Download, Printer, FileText } from 'lucide-react';
import { usePatientStore } from '../../stores/usePatientStore';
import { calculateStayDuration, isLongStay } from '../../utils/stayCalculator';
import { formatDate } from '../../utils/dateFormat';
import { exportLongStayReport } from '../../utils/reportExport';
import type { Patient } from '../../types/patient';

interface LongStayReportProps {
  specialty?: string;
  doctorId?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

const LongStayReport: React.FC<LongStayReportProps> = ({ specialty, doctorId, dateRange }) => {
  const { patients } = usePatientStore();

  const longStayPatients = useMemo(() => {
    return patients.filter((patient: Patient) => {
      const activeAdmission = patient.admissions?.[0];
      if (!activeAdmission || activeAdmission.status !== 'active') return false;

      // Check if patient is long stay
      if (!isLongStay(activeAdmission.admission_date)) return false;

      // Apply filters
      const matchesSpecialty = !specialty || activeAdmission.department === specialty;
      const matchesDoctor = !doctorId || activeAdmission.admitting_doctor_id === doctorId;
      const matchesDateRange = !dateRange || (
        new Date(activeAdmission.admission_date) >= new Date(dateRange.startDate) &&
        new Date(activeAdmission.admission_date) <= new Date(dateRange.endDate)
      );

      return matchesSpecialty && matchesDoctor && matchesDateRange;
    });
  }, [patients, specialty, doctorId, dateRange]);

  const handleExport = () => {
    exportLongStayReport(longStayPatients, {
      specialty,
      doctorId,
      dateRange
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Long Stay Report</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {longStayPatients.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Long Stay Patients</h3>
              <p className="text-gray-500">
                There are currently no patients who have stayed for 6 days or more
              </p>
            </div>
          ) : (
            longStayPatients.map((patient) => {
              const admission = patient.admissions?.[0];
              if (!admission) return null;

              const stayDuration = calculateStayDuration(admission.admission_date);

              return (
                <div
                  key={patient.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {stayDuration} days
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">MRN: {patient.mrn}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Admission Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(admission.admission_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="text-sm font-medium text-gray-900">
                            {admission.department}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Attending Doctor</p>
                          <p className="text-sm font-medium text-gray-900">
                            {admission.doctor_name || 'Not assigned'}
                          </p>
                        </div>
                        {admission.safety_type && (
                          <div>
                            <p className="text-sm text-gray-600">Safety Type</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              admission.safety_type === 'emergency'
                                ? 'bg-red-100 text-red-800'
                                : admission.safety_type === 'observation'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {admission.safety_type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LongStayReport;