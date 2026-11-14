import streamlit as st

from src import database
from src.agent import TempoAgent

st.set_page_config(page_title="TempoAgent", page_icon="T", layout="wide")

if "messages" not in st.session_state:
    st.session_state.messages = []
if "agent" not in st.session_state:
    st.session_state.agent = TempoAgent()

st.title("TempoAgent")
st.caption("Personal Task & Schedule Optimizer Agent")

chat_col, schedule_col = st.columns([3, 2], gap="large")

with chat_col:
    st.subheader("Chat")
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    user_input = st.chat_input(
        "Contoh: Buat jadwal belajar besok jam 19.00 sampai 21.00"
    )
    if user_input:
        st.session_state.messages.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.markdown(user_input)
        with st.chat_message("assistant"):
            with st.spinner("TempoAgent sedang memproses..."):
                try:
                    reply = st.session_state.agent.send_message(user_input)
                except Exception as exc:
                    reply = f"Terjadi kesalahan: {exc}"
            st.markdown(reply)
        st.session_state.messages.append({"role": "assistant", "content": reply})

with schedule_col:
    st.subheader("Jadwal Aktif")
    schedules = database.get_all_upcoming_schedules()

    if not schedules:
        st.info("Belum ada jadwal mendatang.")
    else:
        header = st.columns([4, 1])
        with header[0]:
            st.caption("JADWAL")
        with header[1]:
            st.caption("AKSI")

        for item in schedules:
            row = st.columns([4, 1], vertical_alignment="center")
            with row[0]:
                with st.container(border=True):
                    st.markdown(f"**{item['title']}**")
                    mulai = str(item["start_time"])[:5]
                    selesai = str(item["end_time"])[:5]
                    st.caption(
                        f"{item['schedule_date']} | {mulai} - {selesai} | {item['status']}"
                    )
                    if item.get("description"):
                        st.markdown(item["description"])
            with row[1]:
                if st.button("Hapus", key=f"delete_{item['id']}"):
                    database.delete_schedule(str(item["id"]))
                    st.rerun()

        st.caption(f"Total: {len(schedules)} jadwal")
