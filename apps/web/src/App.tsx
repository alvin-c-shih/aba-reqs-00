import { Navigate, Route, Routes } from "react-router-dom";
import { HOME, useAuth } from "./lib/auth";
import { Login } from "./shell/Login";
import { ChangePassword } from "./shell/ChangePassword";
import { Shell } from "./shell/Shell";
import { Schools } from "./areas/system/Schools";
import { Health } from "./areas/system/Health";
import { AuditLog } from "./areas/system/AuditLog";
import { Overview } from "./areas/school/Overview";
import { People } from "./areas/school/People";
import { Students } from "./areas/school/Students";
import { Caseload } from "./areas/clinic/Caseload";
import { StudentPage } from "./areas/clinic/StudentPage";
import { ProgramPage } from "./areas/clinic/ProgramPage";
import { Review } from "./areas/clinic/Review";
import { Today } from "./areas/collect/Today";
import { SessionScreen } from "./areas/collect/SessionScreen";
import { Gallery } from "./areas/design/Gallery";
import { Report } from "./areas/clinic/Report";
import { ServiceLog } from "./areas/shared/ServiceLog";
import { Child, Children } from "./areas/family/Family";

/* Route map = responsibility map. Each area is a folder under src/areas and is only
   mounted for the roles that own it; the API enforces the same split independently. */
export function App() {
  const { me, meta, ready } = useAuth();
  if (!ready) return null;
  if (!me) return <Login />;
  if (me.must_change_password) return <ChangePassword />;
  const r = me.role;
  return (
    <Shell>
      <Routes>
        {r === "system_admin" && <>
          <Route path="/system" element={<Schools />} />
          <Route path="/system/health" element={<Health />} />
          <Route path="/system/audit" element={<AuditLog scope="platform" />} />
        </>}
        {r === "school_admin" && <>
          <Route path="/school" element={<Overview />} />
          <Route path="/school/people" element={<People />} />
          <Route path="/school/students" element={<Students />} />
          <Route path="/school/audit" element={<AuditLog scope="school" />} />
          <Route path="/school/service-log" element={<ServiceLog />} />
        </>}
        {(r === "bcba" || r === "rbt") && <>
          <Route path="/clinic/programs/:id" element={<ProgramPage />} />
          <Route path="/collect" element={<Today />} />
          <Route path="/collect/:studentId" element={<SessionScreen />} />
        </>}
        {r === "bcba" && <>
          <Route path="/clinic" element={<Caseload />} />
          <Route path="/clinic/students/:id" element={<StudentPage />} />
          <Route path="/clinic/review" element={<Review />} />
          <Route path="/clinic/students/:id/report" element={<Report />} />
          <Route path="/clinic/service-log" element={<ServiceLog />} />
        </>}
        {(r === "parent" || r === "teacher") && <>
          <Route path="/family" element={<Children />} />
          <Route path="/family/:id" element={<Child />} />
        </>}
        {meta?.env !== "prod" && <Route path="/design" element={<Gallery />} />}
        <Route path="*" element={<Navigate to={HOME[r]} replace />} />
      </Routes>
    </Shell>
  );
}
