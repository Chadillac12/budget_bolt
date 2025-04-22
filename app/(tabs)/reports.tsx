import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity
} from 'react-native';
import { Stack } from 'expo-router';
import { 
  Card, 
  Button, 
  Chip, 
  IconButton, 
  Dialog, 
  Portal,
  TextInput,
  SegmentedButtons
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Import types and utilities
import { 
  ReportType, 
  ReportTimePeriod, 
  ReportVisualizationType,
  ReportTemplate,
  ReportConfig,
  SavedReport,
  DEFAULT_REPORT_TEMPLATES
} from '../../types/reports';
import { 
  generateReport, 
  getDateRangeForTimePeriod, 
  formatDateRange,
  getDefaultReportTemplates,
  createReportFromTemplate,
  saveReport
} from '../../utils/reportUtils';
import { getData, storeData } from '../../utils/storage';

/**
 * Reports Screen Component
 * 
 * This component provides the UI for building, viewing, and managing custom reports.
 */
export default function ReportsScreen() {
  // State for managing templates and reports
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'saved' | 'builder'>('templates');
  
  // State for report builder
  const [currentReport, setCurrentReport] = useState<ReportConfig | null>(null);
  const [reportResult, setReportResult] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for dialogs
  const [saveDialogVisible, setSaveDialogVisible] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  
  // Load templates and saved reports on mount
  useEffect(() => {
    loadTemplatesAndReports();
  }, []);
  
  /**
   * Load templates and saved reports from storage
   */
  const loadTemplatesAndReports = async () => {
    // Load default templates
    const defaultTemplates = getDefaultReportTemplates();
    
    // Load saved templates from storage
    const savedTemplates = await getData('budget_tracker_report_templates') || [];
    
    // Combine default and saved templates
    setTemplates([...defaultTemplates, ...savedTemplates]);
    
    // Load saved reports
    const reports = await getData('budget_tracker_saved_reports') || [];
    setSavedReports(reports);
  };
  
  /**
   * Handle selecting a template
   */
  const handleSelectTemplate = (template: ReportTemplate) => {
    const newReport = createReportFromTemplate(template);
    setCurrentReport(newReport);
    setActiveTab('builder');
  };
  
  /**
   * Handle selecting a saved report
   */
  const handleSelectSavedReport = (report: SavedReport) => {
    setCurrentReport(report.config);
    setActiveTab('builder');
  };
  
  /**
   * Generate report based on current configuration
   */
  const handleGenerateReport = async () => {
    if (!currentReport) return;
    
    setIsGenerating(true);
    try {
      const result = await generateReport(currentReport);
      setReportResult(result);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Save current report
   */
  const handleSaveReport = async () => {
    if (!currentReport) return;
    
    const newSavedReport = saveReport(
      currentReport,
      reportName || currentReport.name,
      reportDescription
    );
    
    const updatedReports = [...savedReports, newSavedReport];
    setSavedReports(updatedReports);
    await storeData('budget_tracker_saved_reports', updatedReports);
    
    setSaveDialogVisible(false);
    setReportName('');
    setReportDescription('');
  };
  
  /**
   * Update report configuration
   */
  const updateReportConfig = (updates: Partial<ReportConfig>) => {
    if (!currentReport) return;
    
    setCurrentReport({
      ...currentReport,
      ...updates
    });
    
    // Clear previous results when configuration changes
    setReportResult(null);
  };
  
  /**
   * Render template list
   */
  const renderTemplateList = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Report Templates</Text>
      <Text style={styles.sectionDescription}>
        Select a template to start building your custom report
      </Text>
      
      <View style={styles.templateGrid}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => handleSelectTemplate(template)}
          >
            <Card>
              <Card.Content>
                <View style={styles.templateIconContainer}>
                  <MaterialCommunityIcons
                    name={template.icon as any || 'file-chart'}
                    size={32}
                    color="#007AFF"
                  />
                </View>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription} numberOfLines={2}>
                  {template.description}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
  
  /**
   * Render saved reports list
   */
  const renderSavedReportsList = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Saved Reports</Text>
      
      {savedReports.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="file-search" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No saved reports yet</Text>
          <Button 
            mode="contained" 
            onPress={() => setActiveTab('templates')}
            style={styles.emptyStateButton}
          >
            Create a Report
          </Button>
        </View>
      ) : (
        <View>
          {savedReports.map((report) => (
            <Card key={report.id} style={styles.savedReportCard}>
              <Card.Content>
                <View style={styles.savedReportHeader}>
                  <View>
                    <Text style={styles.savedReportName}>{report.name}</Text>
                    <Text style={styles.savedReportDate}>
                      Created: {format(new Date(report.createdAt), 'MMM d, yyyy')}
                    </Text>
                  </View>
                  <IconButton
                    icon={report.isFavorite ? 'star' : 'star-outline'}
                    size={24}
                    onPress={() => {/* Toggle favorite */}}
                  />
                </View>
                
                {report.description && (
                  <Text style={styles.savedReportDescription}>
                    {report.description}
                  </Text>
                )}
                
                <View style={styles.savedReportMeta}>
                  <Chip icon="calendar" style={styles.chip}>
                    {formatDateRange(
                      new Date(report.config.dateRange.startDate),
                      new Date(report.config.dateRange.endDate)
                    )}
                  </Chip>
                  <Chip icon="tag" style={styles.chip}>
                    {report.config.type}
                  </Chip>
                </View>
              </Card.Content>
              
              <Card.Actions>
                <Button onPress={() => handleSelectSavedReport(report)}>
                  Open
                </Button>
                <Button>Export</Button>
                <Button>Delete</Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
  
  /**
   * Render report builder
   */
  const renderReportBuilder = () => (
    <ScrollView style={styles.container}>
      {currentReport ? (
        <>
          <View style={styles.builderHeader}>
            <Text style={styles.builderTitle}>{currentReport.name}</Text>
            <View style={styles.builderActions}>
              <Button 
                mode="contained" 
                onPress={handleGenerateReport}
                loading={isGenerating}
                disabled={isGenerating}
                style={styles.generateButton}
              >
                Generate Report
              </Button>
              <Button 
                mode="outlined"
                onPress={() => setSaveDialogVisible(true)}
                style={styles.saveButton}
              >
                Save Report
              </Button>
            </View>
          </View>
          
          <Card style={styles.configCard}>
            <Card.Content>
              <Text style={styles.configSectionTitle}>Report Type</Text>
              <SegmentedButtons
                value={currentReport.type}
                onValueChange={(value) => 
                  updateReportConfig({ type: value as ReportType })
                }
                buttons={[
                  { value: ReportType.EXPENSE, label: 'Expense' },
                  { value: ReportType.INCOME, label: 'Income' },
                  { value: ReportType.CATEGORY, label: 'Category' },
                  { value: ReportType.PAYEE, label: 'Payee' },
                ]}
              />
              
              <Text style={styles.configSectionTitle}>Date Range</Text>
              <View style={styles.dateRangeContainer}>
                <SegmentedButtons
                  value={currentReport.dateRange.timePeriod}
                  onValueChange={(value) => {
                    const timePeriod = value as ReportTimePeriod;
                    const { startDate, endDate } = getDateRangeForTimePeriod(timePeriod);
                    updateReportConfig({
                      dateRange: {
                        ...currentReport.dateRange,
                        timePeriod,
                        startDate,
                        endDate
                      }
                    });
                  }}
                  buttons={[
                    { value: ReportTimePeriod.MONTHLY, label: 'Month' },
                    { value: ReportTimePeriod.QUARTERLY, label: 'Quarter' },
                    { value: ReportTimePeriod.YEARLY, label: 'Year' },
                    { value: ReportTimePeriod.CUSTOM, label: 'Custom' },
                  ]}
                />
              </View>
              
              <Text style={styles.configSectionTitle}>Visualization</Text>
              <SegmentedButtons
                value={currentReport.visualization.type}
                onValueChange={(value) => 
                  updateReportConfig({
                    visualization: {
                      ...currentReport.visualization,
                      type: value as ReportVisualizationType
                    }
                  })
                }
                buttons={[
                  { value: ReportVisualizationType.BAR_CHART, label: 'Bar' },
                  { value: ReportVisualizationType.PIE_CHART, label: 'Pie' },
                  { value: ReportVisualizationType.LINE_CHART, label: 'Line' },
                  { value: ReportVisualizationType.TABLE, label: 'Table' },
                ]}
              />
              
              <Text style={styles.configSectionTitle}>Grouping</Text>
              <SegmentedButtons
                value={currentReport.grouping.groupBy}
                onValueChange={(value) => 
                  updateReportConfig({
                    grouping: {
                      ...currentReport.grouping,
                      groupBy: value as any
                    }
                  })
                }
                buttons={[
                  { value: 'category', label: 'Category' },
                  { value: 'payee', label: 'Payee' },
                  { value: 'date', label: 'Date' },
                  { value: 'account', label: 'Account' },
                ]}
              />
            </Card.Content>
          </Card>
          
          {/* Report Results */}
          {reportResult && (
            <Card style={styles.resultsCard}>
              <Card.Content>
                <Text style={styles.resultsTitle}>Report Results</Text>
                
                {/* Summary */}
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={styles.summaryValue}>
                      ${Math.abs(reportResult.summary.totalAmount).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Items</Text>
                    <Text style={styles.summaryValue}>
                      {reportResult.summary.totalCount}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Average</Text>
                    <Text style={styles.summaryValue}>
                      ${Math.abs(reportResult.summary.averageAmount || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                {/* Visualization placeholder */}
                <View style={styles.visualizationContainer}>
                  <Text>Visualization would be rendered here</Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="file-chart" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>
            Select a template to start building your report
          </Text>
          <Button 
            mode="contained" 
            onPress={() => setActiveTab('templates')}
            style={styles.emptyStateButton}
          >
            Browse Templates
          </Button>
        </View>
      )}
      
      {/* Save Report Dialog */}
      <Portal>
        <Dialog visible={saveDialogVisible} onDismiss={() => setSaveDialogVisible(false)}>
          <Dialog.Title>Save Report</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Report Name"
              value={reportName}
              onChangeText={setReportName}
              style={styles.dialogInput}
              placeholder={currentReport?.name || 'My Report'}
            />
            <TextInput
              label="Description (optional)"
              value={reportDescription}
              onChangeText={setReportDescription}
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSaveDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveReport}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
  
  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Custom Reports',
          headerRight: () => (
            <IconButton
              icon="plus"
              onPress={() => setActiveTab('templates')}
            />
          ),
        }}
      />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
            Templates
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
            Saved Reports
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'builder' && styles.activeTab]}
          onPress={() => setActiveTab('builder')}
        >
          <Text style={[styles.tabText, activeTab === 'builder' && styles.activeTabText]}>
            Report Builder
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content based on active tab */}
      {activeTab === 'templates' && renderTemplateList()}
      {activeTab === 'saved' && renderSavedReportsList()}
      {activeTab === 'builder' && renderReportBuilder()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateCard: {
    width: '48%',
    marginBottom: 16,
  },
  templateIconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  emptyStateButton: {
    marginTop: 16,
  },
  savedReportCard: {
    marginBottom: 16,
  },
  savedReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savedReportName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  savedReportDate: {
    fontSize: 12,
    color: '#666',
  },
  savedReportDescription: {
    fontSize: 14,
    color: '#333',
    marginVertical: 8,
  },
  savedReportMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  builderHeader: {
    marginBottom: 16,
  },
  builderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  builderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  generateButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  configCard: {
    marginBottom: 16,
  },
  configSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  dateRangeContainer: {
    marginBottom: 8,
  },
  dateRangePreview: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  dateRangeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  visualizationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  visualizationOption: {
    width: '23%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  visualizationOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  visualizationOptionText: {
    fontSize: 12,
    marginTop: 4,
  },
  sortDirectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sortDirectionLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  resultsCard: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  dataTable: {
    marginTop: 8,
  },
  dialogInput: {
    marginBottom: 16,
  }
});
