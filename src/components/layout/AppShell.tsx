import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ModalRoot } from '../../modals/ModalRoot'

export function AppShell() {
  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
      <ModalRoot />
    </>
  )
}
