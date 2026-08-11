import { ReportsContext, useReportsState } from './reportsStore'

export function ReportsProvider({ children }) {
  const value = useReportsState()
  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
}
