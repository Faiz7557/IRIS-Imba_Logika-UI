# Audit tambahan setelah court v2

Seluruh hasil simulasi 30 ulangan. Planning quotas and bounds use V_proxy; evaluation uses perturbed V_true of same total, fixed r_true, and benefit(min(x,V_true),V_true,r_true). No refit; isolates need-proxy error. Excess planned quota is counted separately, not silently reallocated.

| Galat kebutuhan | KKT gain median | Proporsional gain median |
|---|---:|---:|
| galat lognormal sigma=0,25 | 6.023% | 6.228% |
| kebutuhan terpencil 25% lebih tinggi | 10.371% | 10.452% |
| kebutuhan terpencil 25% lebih rendah | 1.984% | 2.078% |
| galat berbeda gugus dan wilayah | 10.592% | 10.784% |

| Koreksi kebutuhan | Perpindahan kuota KKT | Perpindahan kuota proporsional |
|---|---:|---:|
| galat lognormal sigma=0,25 | 10.119% | 10.096% |
| kebutuhan terpencil 25% lebih tinggi | 4.717% | 4.682% |
| kebutuhan terpencil 25% lebih rendah | 5.161% | 5.126% |
| galat berbeda gugus dan wilayah | 11.901% | 11.860% |

Perpindahan kuota = setengah jumlah selisih absolut kuota / total kuota, jika V evaluasi diketahui lalu solver dijalankan ulang dengan rho tetap. Ini sensitivitas keputusan terhadap koreksi kebutuhan, bukan pelatihan ulang prediksi.

| Tahun transisi | KKT median gain | Proporsional median gain |
|---|---:|---:|
| 1 | 7.437% | 7.448% |
| 2 | 7.868% | 7.855% |
| 3 | 7.912% | 7.892% |
| 4 | 7.890% | 7.892% |
| 5 | 7.869% | 7.912% |

Kedua skema memakai α=0,20, β=0,95 dan batas turun 10% dari tahun sebelumnya, mulai dari merata, dengan pagu/biaya yang sama. Semua batas dan pagu diuji.

Interpretasi: sensitivitas ini memisahkan kesalahan ukuran kebutuhan dari prediksi laju. Ia tidak mengubah data BPS, tidak membuktikan galat proksi sebenarnya, tidak melatih ulang model dan tidak menggantikan validasi pilot. Keunggulan KKT tetap tidak diklaim universal. Lihat excess_capacity_pct untuk kuota yang melampaui kapasitas evaluasi dalam skenario salah ukur.