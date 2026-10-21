import { Icon } from './Icon'

export function RoleSwitch({
  role,
  onChange,
}: {
  role: 'rider' | 'customer'
  onChange: (role: 'rider' | 'customer') => void
}) {
  return (
    <div className="role-switch" aria-label="Choose account type">
      <button
        type="button"
        className={role === 'rider' ? 'active' : ''}
        aria-pressed={role === 'rider'}
        onClick={() => onChange('rider')}
      >
        <Icon name="user" size={17} /> Rider
      </button>
      <button
        type="button"
        className={role === 'customer' ? 'active' : ''}
        aria-pressed={role === 'customer'}
        onClick={() => onChange('customer')}
      >
        <Icon name="location" size={17} /> Customer
      </button>
    </div>
  )
}
