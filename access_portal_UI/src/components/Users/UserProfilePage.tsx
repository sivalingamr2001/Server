import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/constants'
import { Building2, Mail, MapPin, Phone } from 'lucide-react'

export const UserProfilePage = () => {
  const { currentUser } = useAuth();

  // 1. Safe accessors fallback variables derived from your PortalUserDetails schema
  const userProfile = currentUser?.user;
  const departmentInfo = currentUser?.department;
  const hodInfo = currentUser?.headOfDepartment;

  const displayName = userProfile?.name || 'Demo User';

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div>
        {/* Profile Card Container */}
        <div className="bg-card text-card-foreground rounded-[24px] border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">

          {/* Header Gradient Banner */}
          <div className="h-37.5 bg-linear-to-r from-primary to-accent"></div>

          {/* Core Profile Content */}
          <div className="px-10 pb-10">

            {/* Avatar & Title Section */}
            <div className="flex items-end gap-5 -mt-14 mb-8">
              <Avatar className="h-27.5 w-27.5 border-4 border-card shadow-md">
                <AvatarImage src="/avatars/01.png" alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium tracking-wide">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="mb-8">
                <h1 className="text-[28px] font-normal text-card-foreground tracking-tight leading-tight">
                  {displayName}
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5 capitalize">
                  {userProfile?.role || 'User'}
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 text-center border-b border-border pb-6 mb-6">
              <div>
                {/* 2. Mapped to user.id instead of user.userId */}
                <p className="text-[22px] font-normal text-primary">{userProfile?.id || '-'}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">User ID</p>
              </div>
              <div>
                {/* 3. Mapped to user.employeeId instead of cmplUser.empId */}
                <p className="text-[22px] font-normal text-primary">{userProfile?.employeeId || '-'}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Employee ID</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-card-foreground">
                <Mail className="h-4.5 w-4.5 text-primary" />
                {/* 4. Mapped to user.email instead of cmplUser.mailId */}
                <span className="text-[14px]">{userProfile?.email || 'No email available'}</span>
              </div>
              <div className="flex items-center gap-4 text-card-foreground">
                <Phone className="h-4.5 w-4.5 text-primary" />
                {/* 5. Mapped to user.mobileNumber instead of cmplUser.mobNo */}
                <span className="text-[14px]">{userProfile?.mobileNumber || 'No phone available'}</span>
              </div>
              <div className="flex items-center gap-4 text-card-foreground">
                <MapPin className="h-4.5 w-4.5 text-primary" />
                <span className="text-[14px]">{userProfile?.location || 'Default'}</span>
              </div>
            </div>

            {/* Hierarchy & Structure */}
            <div className="space-y-4">
              <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                Organization
              </h2>

              {/* Department Block */}
              <div className="rounded-xl bg-secondary p-5 border border-border flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Department</p>
                  {/* 6. Mapped to department.name instead of department.deptName */}
                  <p className="font-bold text-card-foreground text-[15px] mt-0.5">
                    {departmentInfo?.name || `Department ID: ${userProfile?.departmentId || '-'}`}
                  </p>
                </div>
                <Building2 className="h-5 w-5 text-primary opacity-70" />
              </div>

              {/* Head of Department Block */}
              <div className="rounded-xl bg-secondary p-5 border border-border opacity-95">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-3">
                  Head of Department
                </p>
                {hodInfo ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      {/* 7. Mapped to headOfDepartment.name instead of hod.hodName */}
                      <AvatarImage src="/avatars/02.png" alt='UserProfile' />
                      <AvatarFallback className="bg-chart-1 text-primary-foreground text-xs font-bold">
                        {getInitials(hodInfo.name || 'HOD')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-card-foreground text-[14px] uppercase tracking-wide">
                        {hodInfo.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No Head of Department assigned.</p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
