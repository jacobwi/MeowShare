import apiClient from "./api";
import {
  EmailOptions,
  EmailTemplate,
  EmailConfigSettings,
  SendEmailResponse,
  TemplateRenderResponse,
} from "../types";

// Email service API
export const emailApi = {
  // Send a simple email
  sendEmail: async (options: EmailOptions): Promise<SendEmailResponse> => {
    try {
      const response = await apiClient.post("/email/send", options);
      return response.data;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },

  // Send a file share notification
  sendFileShareNotification: async (
    fileId: string,
    recipients: string[],
    message?: string,
  ): Promise<SendEmailResponse> => {
    try {
      const response = await apiClient.post("/email/share-notification", {
        fileId,
        recipients,
        message,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending file share notification:", error);
      throw error;
    }
  },

  // Send email with template
  sendWithTemplate: async (
    templateId: string,
    to: string | string[],
    data: Record<string, unknown>,
    options?: Partial<EmailOptions>,
  ): Promise<SendEmailResponse> => {
    try {
      const response = await apiClient.post("/email/send-template", {
        templateId,
        to,
        data,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending email with template:", error);
      throw error;
    }
  },

  // Get available email templates
  getTemplates: async (): Promise<EmailTemplate[]> => {
    try {
      const response = await apiClient.get("/email/templates");
      return response.data;
    } catch (error) {
      console.error("Error fetching email templates:", error);
      throw error;
    }
  },

  // Get specific template details
  getTemplate: async (templateId: string): Promise<EmailTemplate> => {
    try {
      const response = await apiClient.get(`/email/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching template ${templateId}:`, error);
      throw error;
    }
  },

  // Preview a template with data
  previewTemplate: async (
    templateId: string,
    data: Record<string, unknown>,
  ): Promise<TemplateRenderResponse> => {
    try {
      const response = await apiClient.post(
        `/email/templates/${templateId}/preview`,
        { data },
      );
      return response.data;
    } catch (error) {
      console.error("Error previewing template:", error);
      throw error;
    }
  },

  // Get current email configuration
  getEmailConfig: async (): Promise<EmailConfigSettings> => {
    try {
      const response = await apiClient.get("/email/config");
      return response.data;
    } catch (error) {
      console.error("Error fetching email configuration:", error);
      throw error;
    }
  },

  // Update email configuration
  updateEmailConfig: async (
    config: EmailConfigSettings,
  ): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.put("/email/config", config);
      return response.data;
    } catch (error) {
      console.error("Error updating email configuration:", error);
      throw error;
    }
  },

  // Test email configuration
  testEmailConfig: async (
    config: EmailConfigSettings,
    testEmail: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post("/email/test-config", {
        config,
        testEmail,
      });
      return response.data;
    } catch (error) {
      console.error("Error testing email configuration:", error);
      throw error;
    }
  },

  // Create or update an email template
  saveTemplate: async (
    template: Omit<EmailTemplate, "id"> & { id?: string },
  ): Promise<EmailTemplate> => {
    try {
      if (template.id) {
        // Update existing template
        const response = await apiClient.put(
          `/email/templates/${template.id}`,
          template,
        );
        return response.data;
      } else {
        // Create new template
        const response = await apiClient.post("/email/templates", template);
        return response.data;
      }
    } catch (error) {
      console.error("Error saving email template:", error);
      throw error;
    }
  },

  // Delete an email template
  deleteTemplate: async (templateId: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete(`/email/templates/${templateId}`);
      return { success: response.status === 200 };
    } catch (error) {
      console.error(`Error deleting template ${templateId}:`, error);
      throw error;
    }
  },
};

export default emailApi;
