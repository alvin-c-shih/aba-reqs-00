"""Phase 2–4: new recording methods, reports, family & teacher access, 2FA, media, AI switches, import."""
import uuid
from datetime import datetime, timedelta, timezone

from aba import ai, security
from aba.config import settings
from aba.routers.reports import units

from .conftest import AVA, BEN, EMAILS, client

DEE = "d0000000-0000-4000-8000-000000000003"
now = lambda **kw: (datetime.now(timezone.utc) + timedelta(**kw)).isoformat()


def _prog(c, student, kind):
    s = next(s for s in c.get("/api/v1/collect/bundle").json()["students"] if s["id"] == student)
    return next(p for p in s["programs"] if p["kind"] == kind)


def test_interval_abc_and_task_data_sync_and_score():
    c, b = client("rbt"), client("bcba")
    sid = str(uuid.uuid4())
    iv, abc = _prog(c, DEE, "interval"), _prog(c, DEE, "abc")
    obs = [{"id": str(uuid.uuid4()), "session_id": sid, "program_id": iv["id"], "kind": "interval", "hit": i < 1, "recorded_at": now(minutes=-20 + i)} for i in range(4)]
    obs.append({"id": str(uuid.uuid4()), "session_id": sid, "program_id": abc["id"], "kind": "abc", "recorded_at": now(minutes=-5),
                "data": {"antecedent": "Task demand", "behavior": "Hit", "consequence": "Task removed"}})
    body = {"device_id": "test-device", "sessions": [{"id": sid, "student_id": DEE, "started_at": now(minutes=-30), "ended_at": now(minutes=-1)}], "observations": obs}
    assert c.post("/api/v1/collect/sync", json=body).json()["stored"] == 5
    point = lambda p: next(x for x in b.get(f"/api/v1/clinic/programs/{p['id']}/series").json()["points"] if x["session_id"] == sid)
    assert point(iv)["value"] == 25 and point(abc)["value"] == 1
    assert b.get(f"/api/v1/clinic/programs/{abc['id']}/series").json()["patterns"]["antecedents"]
    bad = {**body, "observations": [{**obs[0], "id": str(uuid.uuid4()), "program_id": abc["id"]}]}
    assert c.post("/api/v1/collect/sync", json=bad).status_code == 422       # an interval cannot go on an ABC program


def test_service_log_units_and_csv():
    assert [units(m) for m in (7, 8, 22, 23, 45)] == [0, 1, 1, 2, 3]
    b = client("bcba")
    log = b.get("/api/v1/reports/service-log").json()
    assert log["rows"] and log["units"] == sum(r["units"] for r in log["rows"])
    csv = b.get("/api/v1/reports/service-log?format=csv")
    assert csv.headers["content-type"].startswith("text/csv") and "Units (15 min)" in csv.text
    assert client("rbt").get("/api/v1/reports/service-log").status_code == 403
    assert "Program,Method" in b.get(f"/api/v1/reports/students/{BEN}/export.csv").text


def test_parent_sees_only_their_child_and_only_what_was_shared():
    p = client("parent")
    kids = p.get("/api/v1/family/children").json()
    assert [k["first_name"] for k in kids] == ["Ben"]
    assert p.get(f"/api/v1/family/children/{AVA}").status_code == 404
    for path in ("/api/v1/clinic/caseload", f"/api/v1/clinic/programs/f0000000-0000-4000-8000-000000000003/series", "/api/v1/collect/bundle", "/api/v1/school/users"):
        assert p.get(path).status_code == 403
    child = p.get(f"/api/v1/family/children/{BEN}").json()
    assert child["summaries"] and child["goals"]
    assert "recorder" not in str(child) and "Marcus" not in str(child)          # no staff-level detail
    assert all(m["author"] for m in child["messages"]) and len(child["messages"]) == 2   # family thread only


def test_teacher_gets_goals_but_not_family_summaries():
    t = client("teacher")
    assert sorted(k["first_name"] for k in t.get("/api/v1/family/children").json()) == ["Ava", "Ben", "Cam"]
    child = t.get(f"/api/v1/family/children/{BEN}").json()
    assert "summaries" not in child and "support" in child["goals"][0]
    assert t.post(f"/api/v1/family/children/{BEN}/home", json={"program_id": str(uuid.uuid4()), "count": 1}).status_code == 403


def test_home_data_waits_for_review_and_notifies_the_bcba():
    p, b = client("parent"), client("bcba")
    prog = p.get(f"/api/v1/family/children/{BEN}").json()["home"][0]
    before = len([r for r in b.get("/api/v1/clinic/review").json() if r["review_state"] == "pending"])
    assert p.post(f"/api/v1/family/children/{BEN}/home", json={"program_id": prog["id"], "count": 3, "note": "After dinner"}).status_code == 201
    pending = [r for r in b.get("/api/v1/clinic/review").json() if r["review_state"] == "pending"]
    assert len(pending) == before + 1 and "parent" in pending[0]["review_why"]
    assert b.get(f"/api/v1/clinic/programs/{prog['id']}/series").json()["points"] == []        # not counted until accepted
    assert any(n["kind"] == "review" for n in b.get("/api/v1/me/notifications").json()["items"])


def test_messages_respect_audience():
    r, b = client("rbt"), client("bcba")
    assert r.post(f"/api/v1/clinic/students/{BEN}/messages", json={"audience": "family", "body": "hi"}).status_code == 403
    assert {m["audience"] for m in r.get(f"/api/v1/clinic/students/{BEN}/messages").json()} == {"team"}
    assert b.post(f"/api/v1/clinic/students/{BEN}/messages", json={"audience": "family", "body": "See you Thursday"}).status_code == 201
    assert client("parent").get("/api/v1/me/notifications").json()["unread"] >= 1


def test_two_factor_sign_in():
    c = client("bcba")
    secret = c.post("/api/v1/auth/2fa/setup").json()["secret"]
    assert c.post("/api/v1/auth/2fa/enable", json={"code": "000000"}).status_code == 422
    codes = c.post("/api/v1/auth/2fa/enable", json={"code": security.totp_now(secret)}).json()["recovery_codes"]
    cred = {"email": EMAILS["bcba"], "password": settings.demo_password}
    n = client()
    r = n.post("/api/v1/auth/login", json=cred)
    assert r.status_code == 401 and r.json()["code"] == "totp_required"
    assert n.post("/api/v1/auth/login", json={**cred, "code": "123456"}).status_code == 401
    assert n.post("/api/v1/auth/login", json={**cred, "code": security.totp_now(secret)}).json()["two_factor"] is True
    assert client().post("/api/v1/auth/login", json={**cred, "code": codes[0]}).status_code == 200      # recovery code…
    assert client().post("/api/v1/auth/login", json={**cred, "code": codes[0]}).status_code == 401      # …works once
    assert security.totp_verify("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "287082", at=59)                    # RFC 6238 test vector


def test_media_needs_consent_and_stays_inside_the_school():
    b = client("bcba")
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 64
    assert b.post(f"/api/v1/clinic/students/{AVA}/media", content=png, headers={"content-type": "image/png"}).status_code == 403
    assert b.post(f"/api/v1/clinic/students/{BEN}/media", content=png, headers={"content-type": "text/html"}).status_code == 415
    mid = b.post(f"/api/v1/clinic/students/{BEN}/media", content=png, headers={"content-type": "image/png"}).json()["id"]
    assert b.get(f"/api/v1/clinic/media/{mid}").content == png
    assert client("other_bcba").get(f"/api/v1/clinic/media/{mid}").status_code == 404
    assert client("parent").get(f"/api/v1/clinic/media/{mid}").status_code == 403


def test_ai_is_off_unless_the_school_switches_it_on(monkeypatch):
    monkeypatch.setattr(ai, "text_model", lambda: "test-model")
    monkeypatch.setattr(ai, "generate", lambda system, prompt, max_tokens=0: ("Ben had a good month.", "test-model"))
    assert client("other_bcba").post("/api/v1/clinic/ai/ask", json={"question": "Who needs attention?"}).status_code == 403
    b = client("bcba")
    assert b.post(f"/api/v1/clinic/students/{BEN}/ai/summary", json={"days": 30}).json() == {"text": "Ben had a good month.", "model": "test-model"}
    a = client("admin")
    assert a.put("/api/v1/school/features", json={"ai": False, "voice": False}).status_code == 200
    assert b.post("/api/v1/clinic/ai/ask", json={"question": "Who needs attention?"}).status_code == 403
    assert not ai._local("https://api.example.com")            # only a model on this machine is ever called


def test_roster_import_validates_before_it_writes():
    a = client("admin")
    rows = [{"first_name": "Mia", "last_name": "Okoye", "site": "Bronx"}, {"first_name": "Ava", "last_name": "Morales", "site": "East Harlem",
            "birth_date": next(s for s in a.get("/api/v1/school/students").json() if s["first_name"] == "Ava")["birth_date"]}, {"first_name": "Zed", "last_name": "Q", "site": "Nowhere"}]
    dry = a.post("/api/v1/school/students/import", json={"rows": rows}).json()
    assert (dry["ok"], dry["errors"], dry["committed"]) == (1, 1, False)
    assert a.post("/api/v1/school/students/import", json={"rows": rows, "dry_run": False}).status_code == 422
    done = a.post("/api/v1/school/students/import", json={"rows": rows[:1], "dry_run": False}).json()
    assert done["committed"] and any(s["first_name"] == "Mia" for s in a.get("/api/v1/school/students").json())


def test_inviting_a_parent_links_only_the_named_student():
    a = client("admin")
    r = a.post("/api/v1/school/contacts", json={"name": "Sam Morales", "email": "sam.morales@family.example", "role": "parent", "relation": "Father", "student_ids": [AVA]})
    assert r.status_code == 201
    n = client()
    n.post("/api/v1/auth/login", json={"email": "sam.morales@family.example", "password": r.json()["temp_password"]})
    assert n.post("/api/v1/auth/password", json={"current": r.json()["temp_password"], "new": "a-long-Passphrase-42"}).status_code == 200
    n2 = client()
    n2.post("/api/v1/auth/login", json={"email": "sam.morales@family.example", "password": "a-long-Passphrase-42"})
    assert [k["first_name"] for k in n2.get("/api/v1/family/children").json()] == ["Ava"]


def test_voice_notes_need_the_school_switch_and_a_local_speech_model(monkeypatch):
    audio = b"RIFF" + b"0" * 64
    hdr = {"content-type": "audio/wav"}
    monkeypatch.setattr(ai, "WHISPER_URL", "http://127.0.0.1:8178")
    monkeypatch.setattr(ai, "transcribe", lambda data, mime: "Ben asked for a break.")
    assert client("other_bcba").post("/api/v1/clinic/transcribe", content=audio, headers=hdr).status_code == 403   # school has it off
    assert client("parent").post("/api/v1/clinic/transcribe", content=audio, headers=hdr).status_code == 403
    r = client("rbt")
    assert r.post("/api/v1/clinic/transcribe", content=audio, headers=hdr).json() == {"text": "Ben asked for a break."}
    assert r.post("/api/v1/clinic/transcribe", content=b"", headers=hdr).status_code == 413
    assert r.get("/api/v1/auth/me").json()["features"]["voice"] is True
    monkeypatch.undo()
    monkeypatch.setattr(ai, "WHISPER_URL", "https://speech.example.com")                 # a hosted model is never called
    assert not ai.speech_available()
    assert r.post("/api/v1/clinic/transcribe", content=audio, headers=hdr).status_code == 503
    assert r.get("/api/v1/auth/me").json()["features"]["voice"] is False


def test_text_model_prefers_llm_url_falls_back_to_ollama_and_stays_local(monkeypatch):
    seen = []
    def fake(url, body=None, timeout=1.5):
        seen.append(url)
        if url == "http://127.0.0.1:8080/v1/models":
            return {"data": [{"id": "gemma-test"}]}
        if url == "http://127.0.0.1:8080/v1/chat/completions":
            assert body["messages"][0]["role"] == "system" and body["chat_template_kwargs"] == {"enable_thinking": False}
            return {"choices": [{"message": {"content": " A draft. "}}]}
        if url == "http://127.0.0.1:11434/api/tags":
            return {"models": [{"name": "nemo-test"}]}
        if url == "http://127.0.0.1:11434/api/generate":
            return {"response": "From Ollama."}
        raise OSError("unreachable")
    monkeypatch.setattr(ai, "_json", fake)
    monkeypatch.setattr(ai, "AI_MODEL", "")
    monkeypatch.setattr(ai, "OLLAMA_URL", "http://127.0.0.1:11434")
    monkeypatch.setattr(ai, "LLM_URL", "http://127.0.0.1:8080")
    assert ai.generate("sys", "prompt") == ("A draft.", "gemma-test")
    monkeypatch.setattr(ai, "LLM_URL", "http://127.0.0.1:9")                 # configured but not running: fall back
    assert ai.generate("sys", "prompt") == ("From Ollama.", "nemo-test")
    seen.clear()
    monkeypatch.setattr(ai, "LLM_URL", "https://api.example.com")             # a hosted model is never called
    monkeypatch.setattr(ai, "OLLAMA_URL", "http://10.0.0.5:11434")
    assert ai.text_model() is None and seen == []


def test_family_goals_say_what_is_counted_and_which_way_is_better():
    from aba.routers.reports import _trend
    goals = {g["name"]: g for g in client("parent").get(f"/api/v1/family/children/{BEN}").json()["goals"]}
    leave = goals["Leaving the work area"]                    # a behaviour to reduce is named for what is counted
    assert leave["better"] == "lower" and leave["measure"] == "times in a session"
    assert goals["Asking for things he wants"]["better"] == "higher"
    assert set(leave) == {"id", "name", "domain", "plain", "kind", "criterion", "values", "measure", "better", "trend",
                          "first_text", "last_text", "target_text", "sessions"}      # nothing clinical leaks into the family shape
    assert _trend("frequency", "decrease", 7, 0) == "Moving toward the goal"          # a falling count is good news
    assert _trend("frequency", "decrease", 1, 6) == "Moving away from the goal"
    assert _trend("trial", "increase", 60, 62) == "About the same"
