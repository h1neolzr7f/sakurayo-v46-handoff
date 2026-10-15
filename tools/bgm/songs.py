from compose import *
random.seed(46)
def hum(v, j=6): return v + random.randint(-j, j)
def seq(song, ch, start_bar, bars_notes, vel=84, beats=4, legato=0.95):
    """bars_notes: list of bars, each a list of (pitch|None, dur)"""
    b = start_bar * beats
    for bar in bars_notes:
        t = b
        for p, d in bar:
            if p: song.note(ch, t, d * legato, p, hum(vel))
            t += d
        b += beats

def lobby():
    s = Song(82, 16)
    pno = s.track(0, 0, 92, 52, 60); stg = s.track(1, 49, 70, 64, 80, 30); koto = s.track(2, 107, 100, 76, 55)
    flt = s.track(3, 73, 88, 54, 70); vc = s.track(4, 42, 78, 64, 60); harp = s.track(5, 46, 70, 40, 70)
    perc = s.track(9, 0, 50, 64, 40)
    prog = [('D',''),('A',''),('B','m'),('F#','m'),('G',''),('D',''),('E','m7'),('A','7'),
            ('D',''),('A',''),('B','m'),('F#','m'),('G',''),('A',''),('D','sus2'),('D','')]
    for i, (r, q) in enumerate(prog):
        b = i * 4; c3 = chord(r, q, 3); c4 = chord(r, q, 4)
        s.note(vc, b, 3.9, c3[0] - 12, 70)
        s.notes(stg, b, 4.0, c4[:3], 48 if i < 8 else 58)
        # piano: low root + flowing 8th arpeggio
        s.note(pno, b, 1.9, c3[0], 70); s.note(pno, b + 2, 1.9, c3[0] + 7, 60)
        arp = [c4[0], c4[1] + 0, c4[2], c4[0] + 12, c4[2], c4[1] + 12 if len(c4) > 1 else c4[1], c4[2], c4[1]]
        for k, p in enumerate(arp): s.note(pno, b + k * 0.5, 0.6, p, hum(54 if k % 2 else 62, 5))
        if i % 4 == 3: s.notes(harp, b + 3, 1.0, [c4[0], c4[1], c4[2], c4[0] + 12], 58, strum=0.08)
        if i >= 8:
            for k in range(8): s.note(perc, b + k * 0.5, 0.2, 70, hum(34 if k % 2 else 44, 4))  # maracas
        if i in (0, 8): s.note(perc, b, 1, 81, 46)  # open triangle on phrase starts
    seq(s, koto, 0, [[('F#5',1),('A5',1),('B5',.5),('A5',.5),('F#5',1)],[('E5',3),('D5',.5),('E5',.5)],
        [('F#5',1),('D5',1),('B4',1),('D5',1)],[('C#5',2),('A4',2)],[('B4',1),('D5',1),('G5',1),('F#5',.5),('E5',.5)],
        [('F#5',3),('A5',1)],[('G5',1),('F#5',1),('E5',1),('D5',1)],[('E5',4)]], vel=92)
    seq(s, flt, 8, [[('A5',1.5),('B5',.5),('A5',1),('F#5',1)],[('E5',1),('C#5',1),('E5',1),('A5',1)],
        [('B5',1.5),('A5',.5),('F#5',1),('D5',1)],[('E5',1),('F#5',1),('C#5',2)],[('D5',1),('E5',1),('G5',1),('B5',1)],
        [('A5',2),('E5',2)],[('F#5',1),('E5',1),('D5',2)],[('D5',3),(None,1)]], vel=80, legato=0.98)
    # koto echoes under the flute
    seq(s, koto, 8, [[(None,3),('D6',1)],[(None,3),('C#6',1)],[(None,3),('B5',1)],[(None,3),('A5',1)],
                     [(None,3),('B5',1)],[(None,3),('C#6',1)],[(None,4)],[(None,4)]], vel=64)
    return s

def gacha():
    s = Song(70, 12)
    cel = s.track(0, 8, 84, 44, 85); harp = s.track(1, 46, 80, 84, 80); pad = s.track(2, 89, 72, 64, 90, 40)
    ch = s.track(3, 52, 70, 64, 95); box = s.track(4, 10, 82, 64, 85); bass = s.track(5, 89, 60, 64, 70)
    glk = s.track(6, 9, 60, 90, 90)
    prog = [('E','maj7'),('F#',''),('C#','m7'),('A','maj7'),('E','maj7'),('F#',''),('G#','m7'),('B','sus4'),
            ('A','maj7'),('B',''),('C#','m7'),('B','sus4')]
    for i, (r, q) in enumerate(prog):
        b = i * 4; c4 = chord(r, q, 4); c3 = chord(r, q, 3)
        s.notes(pad, b, 4.0, [c3[0]] + c4[1:], 54)
        s.note(bass, b, 4.0, 40 if r in ('E','F#') else c3[0] - 12, 50)  # E pedal under lydian II
        tones = sorted(set([p + 12 for p in c4] + [p + 24 for p in c4[:2]]))
        for k in range(16):
            p = tones[(k * 2 + (k // 4)) % len(tones)]
            s.note(cel, b + k * 0.25, 0.4, p, hum(46 if k % 4 else 60, 4))
        s.notes(harp, b, 2.0, [c3[0], c3[1], c3[2], c4[0], c4[1], c4[2]], 56, strum=0.11)
        if i >= 4: s.notes(ch, b, 4.0, c4[:3], 44 + (8 if i >= 8 else 0))
        if i % 2 == 1: s.note(glk, b + 3.5, 1.0, c4[-1] + 24, 40)
    seq(s, box, 4, [[('G#5',1),('B5',1),('D#6',2)],[('C#6',1.5),('A#5',.5),('F#5',2)],[('B5',1),('G#5',1),('D#5',2)],[('F#5',2),('E5',2)],
                    [('E5',1),('A5',1),('C#6',2)],[('D#6',1),('F#6',1),('D#6',2)],[('E6',1.5),('C#6',.5),('G#5',2)],[('F#5',3),(None,1)]], vel=74)
    return s

def battle():
    s = Song(150, 24)
    dr = s.track(9, 0, 104, 64, 30); bass = s.track(0, 38, 98, 64, 20); stc = s.track(1, 48, 80, 50, 50)
    sham = s.track(2, 106, 104, 80, 55); brass = s.track(3, 61, 86, 64, 60); hi = s.track(4, 48, 76, 40, 70)
    A = [('A','m'),('F',''),('G',''),('E','m'),('A','m'),('F',''),('G',''),('E','')]
    B = [('F',''),('G',''),('A','m'),('A','m'),('D','m'),('E','m'),('F',''),('E','')]
    prog = A + B + A
    for i, (r, q) in enumerate(prog):
        b = i * 4; c2 = chord(r, q, 2); c4 = chord(r, q, 4)
        sec = i // 8; last = i % 8 == 7
        for k in range(8):  # driving bass
            p = c2[0] + (12 if (sec == 1 and k % 2) else 0)
            s.note(bass, b + k * 0.5, 0.42, p, hum(92 if k % 2 == 0 else 78, 4))
        pat = [c4[0], c4[2], c4[0] + 12, c4[2]]
        for k in range(16):
            s.note(stc, b + k * 0.25, 0.16, pat[k % 4] - 12 * (k // 8 % 2 == 1 and sec == 1), hum(70 if k % 4 == 0 else 54, 5))
        # drums
        if i % 8 == 0: s.note(dr, b, 1.5, 49, 100)
        kicks = [0, 1.5, 2, 3.5] if not last else [0, 1.5, 2]
        for t in kicks: s.note(dr, b + t, 0.2, 36, hum(104, 4))
        for t in ([1, 3] if not last else [1]): s.note(dr, b + t, 0.2, 38, hum(98, 4))
        for k in range(8 if not last else 4): s.note(dr, b + k * 0.5, 0.1, 42, hum(70 if k % 2 == 0 else 50, 5))
        if last:
            for k in range(8): s.note(dr, b + 2 + k * 0.25, 0.1, [38, 38, 45, 45, 43, 43, 41, 41][k], 64 + k * 6)
        if sec == 1:
            for t in (0, 1.5): s.notes(brass, b + t, 0.45, c4[:3], 88)
            s.note(dr, b + 3, 0.2, 39, 70)  # clap
    lead = [[('A4',.5),('C5',.5),('E5',1),('D5',.5),('C5',.5),('D5',1)],[('C5',1.5),('A4',.5),('C5',1),('E5',1)],
            [('D5',1),('G5',1),('F5',.5),('E5',.5),('D5',1)],[('E5',3),('B4',1)],
            [('A5',1),('G5',.5),('E5',.5),('D5',1),('E5',1)],[('F5',1.5),('E5',.5),('C5',2)],
            [('D5',.5),('E5',.5),('G5',1),('A5',1),('B5',1)],[('G#5',2),('B5',2)]]
    seq(s, sham, 0, lead, vel=100, legato=0.85)
    seq(s, hi, 8, [[('A4',2),('C5',2)],[('B4',2),('D5',2)],[('E5',4)],[('E5',1),('D5',1),('C5',1),('B4',1)],
                   [('A4',2),('F5',2)],[('G5',2),('E5',2)],[('A5',2),('G5',2)],[('G#5',4)]], vel=92, legato=1.0)
    seq(s, sham, 16, [[(p and n(p) + 12, d) if p else (None, d) for p, d in bar] for bar in lead], vel=94, legato=0.85)
    seq(s, hi, 16, lead, vel=70, legato=0.9)
    return s

def boss():
    s = Song(140, 24)
    dr = s.track(9, 0, 110, 64, 40); tk = s.track(0, 116, 120, 64, 50); tmp = s.track(1, 47, 110, 64, 60)
    lo = s.track(2, 48, 92, 54, 50); br = s.track(3, 61, 96, 72, 60); hn = s.track(4, 60, 110, 60, 70)
    ch = s.track(5, 52, 92, 64, 90); hi = s.track(6, 48, 84, 80, 70)
    A = [('D','m'),('A#',''),('C',''),('A','m'),('D','m'),('A#',''),('G','m'),('A','')]
    B = [('A#',''),('C',''),('D','m'),('D','m'),('G','m'),('A',''),('D','m'),('A','')]
    prog = A + B + A
    for i, (r, q) in enumerate(prog):
        b = i * 4; c2 = chord(r, q, 2); c4 = chord(r, q, 4); sec = i // 8; last = i % 8 == 7
        for k in range(16): s.note(lo, b + k * 0.25, 0.2, c2[0] + 12 + (7 if k % 8 == 6 else 0), hum(78 if k % 4 == 0 else 60, 5))
        s.note(tmp, b, 0.9, c2[0] + 12, 100); s.note(tmp, b + 2, 0.9, c2[0] + 19, 88)
        for t, v in ((0, 118), (0.75, 84), (1.5, 96), (2, 112), (3, 92), (3.5, 100)): s.note(tk, b + t, 0.5, 48 if t in (0, 2) else 55, hum(v, 4))
        s.note(dr, b, 0.3, 36, 112); s.note(dr, b + 2, 0.3, 38, 110)
        if i % 4 == 0: s.note(dr, b, 2, 49, 104)
        for k in range(4): s.note(dr, b + k + 0.5, 0.1, 42, 54)
        if last:
            for k in range(8): s.note(dr, b + 2 + k * 0.25, 0.1, [50, 50, 48, 48, 47, 47, 45, 45][k], 70 + k * 5)
        s.notes(ch, b, 4.0, c4[:3], 70 if sec != 1 else 92)
        if sec >= 1:
            s.notes(br, b, 1.4, [c4[0] - 12] + c4[:3], 96); s.notes(br, b + 2.5, 1.2, [c4[0] - 12] + c4[:3], 84)
    melA = [[('D4',1),('A4',2),('G4',.5),('F4',.5)],[('A#4',3),('A4',1)],[('G4',1.5),('F4',.5),('E4',1),('C4',1)],[('E4',4)],
            [('D5',1),('A4',2),('F4',1)],[('A#4',2),('D5',2)],[('G4',1),('A#4',1),('D5',2)],[('C#5',2),('E5',2)]]
    melB = [[('F5',4)],[('E5',2),('G5',2)],[('F5',2),('A5',2)],[('D5',4)],[('A#4',2),('D5',2)],[('C#5',2),('E5',2)],
            [('F5',1.5),('E5',.5),('D5',2)],[('E5',2),('C#5',2)]]
    seq(s, hn, 0, melA, vel=104, legato=0.97)
    seq(s, hn, 8, melB, vel=110, legato=0.97); seq(s, hi, 8, melB, vel=90, legato=1.0)
    seq(s, hn, 16, melA, vel=112, legato=0.97)
    seq(s, hi, 16, [[(p and n(p) + 12, d) if p else (None, d) for p, d in bar] for bar in melA], vel=96, legato=1.0)
    return s

def win():
    s = Song(112, 3)
    br = s.track(0, 61, 110, 64, 60); stg = s.track(1, 48, 96, 64, 70); tmp = s.track(2, 47, 100, 64, 60)
    cel = s.track(3, 8, 80, 80, 80); hn = s.track(4, 60, 100, 50, 60)
    for k, p in enumerate(['G4', 'C5', 'E5']): s.note(br, k / 3, 1 / 3, p, 100)
    s.notes(br, 1, 1.0, [n('C4'), n('E4'), n('G4'), n('C5')], 108); s.notes(stg, 1, 1.0, chord('C', '', 4), 92)
    s.notes(br, 2, 1.0, chord('F', '', 4), 100); s.notes(stg, 2, 1.0, chord('F', '', 4), 90)
    s.notes(br, 3, 1.0, chord('G', '', 4), 104); s.notes(stg, 3, 1.0, chord('G', '7', 4), 92)
    s.notes(br, 4, 4.0, [n('C4'), n('E4'), n('G4'), n('C5'), n('E5')], 116); s.notes(stg, 4, 4.0, chord('C', 'add9', 4), 100)
    s.note(hn, 4, 4, 'G5', 96)
    for k in range(12): s.note(tmp, 3 + k / 12, 0.1, 'C3', 60 + k * 4)
    s.note(tmp, 4, 1, 'C3', 120)
    for k, p in enumerate(['C6', 'E6', 'G6', 'C7']): s.note(cel, 4 + k * 0.25, 1.5, p, 70)
    return s

def lose():
    s = Song(66, 3)
    pno = s.track(0, 0, 100, 64, 70); stg = s.track(1, 49, 80, 64, 85)
    seq(s, pno, 0, [[('E5',1),('C5',1),('A4',1),('B4',1)],[('C5',1),('A4',1),('F4',2)],[('E4',4)]], vel=70, legato=1.0)
    s.notes(stg, 0, 4, chord('A', 'm', 3), 60); s.notes(stg, 4, 4, chord('F', 'maj7', 3), 56); s.notes(stg, 8, 4, chord('A', 'm', 3), 52)
    s.notes(pno, 8, 4, [n('A2'), n('E3'), n('A3')], 58)
    return s

if __name__ == '__main__':
    for name, fn, loop in [('lobby', lobby, True), ('gacha', gacha, True), ('battle', battle, True), ('boss', boss, True), ('win', win, False), ('lose', lose, False)]:
        out, sec = render(fn(), name, loop=loop, rms_db=-17 if loop else -19)
        print(name, round(sec, 1), 's', out)
