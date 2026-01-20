import React, { useState } from 'react';
import FormInsertButtons from './FormInsertButtons';
import InsertModal from './InsertModal';
import { getSectionFields, getSectionLabel } from '../services/sectionFieldsService';

interface FormWithInsertButtonsProps {
  activeSection: string;
  formData: Record<string, any>;
  onSectionChange: (section: string) => void;
  onAddData: (section: string, data: Record<string, any>) => void;
}

export const FormWithInsertButtons: React.FC<FormWithInsertButtonsProps> = ({
  activeSection,
  formData,
  onSectionChange,
  onAddData
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');

  const handleAddClick = (section: string) => {
    setSelectedSection(section);
    setIsModalOpen(true);
    onSectionChange(section);
  };

  const handleModalSubmit = (data: Record<string, any>) => {
    onAddData(selectedSection, data);
    setIsModalOpen(false);
  };

  const fields = getSectionFields(selectedSection);
  const sectionLabel = getSectionLabel(selectedSection);

  return (
    <div className="space-y-6">
      <FormInsertButtons
        activeSection={activeSection}
        onAddClick={handleAddClick}
      />

      <InsertModal
        isOpen={isModalOpen}
        sectionName={sectionLabel}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        fields={fields}
      />
    </div>
  );
};

export default FormWithInsertButtons;
